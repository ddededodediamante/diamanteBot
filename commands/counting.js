const {
  SlashCommandBuilder,
  InteractionContextType,
  ApplicationIntegrationType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ChannelType,
  PermissionsBitField,
} = require("discord.js");

const { get, set } = require("../functions/db");

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
          .setDescription("Whenever resetting is active or not")
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub.setName("reset").setDescription("Reset the count manually")
  )
  .addSubcommand((sub) =>
    sub.setName("disable").setDescription("Disable farewell messages")
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
      ephemeral: true,
    });

  const configKey = `counting.${guild.id}`;
  const config = get(configKey) || { resetOnWrong: false, count: 0 };

  switch (subcommand) {
    case "channel": {
      const channel = interaction.options.getChannel("target");

      config.channel = channel.id;
      set(configKey, config);

      await channel.send(
        "Counting was setup on this channel. The next number is **1**!"
      );

      embed
        .setTitle("✅ Counting Channel Set")
        .setDescription(`Users can start counting in ${channel}`);
      break;
    }
    case "reset-on-wrong": {
      const active = interaction.options.getBoolean("active");

      config.resetOnWrong = active;
      set(configKey, config);

      embed
        .setTitle("✅ Configuration Changed")
        .setDescription(`Configuration \`reset on wrong\` set to ${active}`);
      break;
    }
    case "reset": {
      config.count = 0;
      delete config.lastUser;
      set(configKey, config);

      embed
        .setTitle("✅ Count Reseted")
        .setDescription(`The count has been reseted. The next number is **1**.`);
      break;
    }
    case "disable": {
      if (!config || !config.channel)
        return interaction.reply({
          content: "❌ Counting channel was already disabled",
          ephemeral: true,
        });

      delete config.channel;
      set(configKey, config);

      embed
        .setTitle("✅ Counting Disabled")
        .setDescription(`The counting channel is now disabled`);
      break;
    }
    default:
      return interaction.reply({
        content: "❌ Unknown subcommand",
        ephemeral: true,
      });
  }

  embed.setFooter({ text: `Guild ID: ${guild.id}` });
  embed.setColor("Green");

  return await interaction.reply({ embeds: [embed] });
};

module.exports = { data, run };
