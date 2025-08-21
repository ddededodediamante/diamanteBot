const {
  SlashCommandBuilder,
  InteractionContextType,
  ApplicationIntegrationType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ChannelType,
  PermissionsBitField,
} = require("discord.js");
const Server = require("../models/serverSchema.js");

const data = new SlashCommandBuilder()
  .setName("counting")
  .setDescription("Fun | Create a counting channel")
  .setContexts(InteractionContextType.Guild)
  .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
  .addSubcommand((sub) =>
    sub
      .setName("channel")
      .setDescription("Setup the channel for counting")
      .addChannelOption((opt) =>
        opt
          .setName("target")
          .setDescription("The channel to set as counting")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("reset-on-wrong")
      .setDescription("If an user counts wrong, the count will be reset")
      .addBooleanOption((opt) =>
        opt
          .setName("active")
          .setDescription("Whether resetting is active or not")
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub.setName("reset").setDescription("Reset the count manually")
  )
  .addSubcommand((sub) =>
    sub.setName("disable").setDescription("Disable counting")
  );

const run = async (interaction = ChatInputCommandInteraction.prototype) => {
  const guild = interaction.guild;
  const subcommand = interaction.options.getSubcommand();
  let embed = new EmbedBuilder();

  if (
    !interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)
  )
    return interaction.reply({
      content: "❌ You need the `Manage Server` permission to do this",
      flags: "Ephemeral",
    });

  let serverConfig = await Server.findOne({ id: guild.id });
  if (!serverConfig) {
    serverConfig = new Server({ id: guild.id });
  }

  switch (subcommand) {
    case "channel": {
      const channel = interaction.options.getChannel("target");
      serverConfig.counting.channel = channel.id;
      serverConfig.counting.count = 0;
      await serverConfig.save();

      await channel.send(
        "Counting was setup in this channel. The next number is **1**!"
      );

      embed
        .setTitle("✅ Counting Channel Set")
        .setDescription(`Users can start counting in ${channel}`);
      break;
    }
    case "reset-on-wrong": {
      const active = interaction.options.getBoolean("active");
      serverConfig.counting.resetOnWrong = active;
      await serverConfig.save();

      embed
        .setTitle("✅ Configuration Changed")
        .setDescription(`Configuration \`reset on wrong\` set to ${active}`);
      break;
    }
    case "reset": {
      serverConfig.counting.count = 0;
      serverConfig.counting.lastUser = null;
      await serverConfig.save();

      embed
        .setTitle("✅ Count Reset")
        .setDescription(`The count has been reset. The next number is **1**.`);
      break;
    }
    case "disable": {
      if (!serverConfig.counting.channel)
        return interaction.reply({
          content: "❌ Counting channel was already disabled",
          flags: "Ephemeral",
        });

      serverConfig.counting.channel = null;
      await serverConfig.save();

      embed
        .setTitle("✅ Counting Disabled")
        .setDescription(`The counting channel is now disabled`);
      break;
    }
    default:
      return interaction.reply({
        content: "❌ Unknown subcommand",
        flags: "Ephemeral",
      });
  }

  embed.setFooter({ text: `Guild ID: ${guild.id}` }).setColor("Green");
  return interaction.reply({ embeds: [embed] });
};

module.exports = { data, run };
