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
  .setName("farewell")
  .setDescription("Util | Farewell new users with custom messages")
  .setContexts(InteractionContextType.Guild)
  .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
  .addSubcommand((sub) =>
    sub
      .setName("channel")
      .setDescription("Set the channel for farewell messages")
      .addChannelOption((opt) =>
        opt
          .setName("target")
          .setDescription("Channel to send farewell messages")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("messages")
      .setDescription("Set farewell messages, separated by '/'")
      .addStringOption((opt) =>
        opt
          .setName("string")
          .setDescription("Messages separated by '/', use {user} for username")
          .setRequired(true)
          .setMaxLength(1500)
      )
  )
  .addSubcommand((sub) =>
    sub.setName("disable").setDescription("Disable farewell messages")
  );

const run = async (interaction = ChatInputCommandInteraction.prototype) => {
  const guild = interaction.guild;
  const subcommand = interaction.options.getSubcommand();
  let embed = new EmbedBuilder();

  if (!guild)
    return interaction.reply({
      content: "❌ This command can only be used in a server",
      ephemeral: true,
    });

  if (
    !interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)
  )
    return interaction.reply({
      content: "❌ You need the `Manage Server` permission to do this",
      ephemeral: true,
    });

  const configKey = `farewell.${guild.id}`;
  const config = get(configKey) || {};

  switch (subcommand) {
    case "channel": {
      const channel = interaction.options.getChannel("target");

      config.channel = channel.id;
      set(configKey, config);

      embed
        .setTitle("✅ Farewell Channel Set")
        .setDescription(`Farewell messages will be sent in ${channel}`);
      break;
    }
    case "messages": {
      const input = interaction.options.getString("string");
      const messages = input
        .split("/")
        .map((msg) => msg.trim())
        .filter(Boolean);

      if (!messages.length)
        return interaction.reply({
          content: "❌ You must provide at least one message",
          ephemeral: true,
        });

      config.messages = messages;
      set(configKey, config);

      embed
        .setTitle("✅ Farewell Messages Set")
        .setDescription(`Saved ${messages.length} message(s)`);
      break;
    }
    case "disable": {
      if (!config || !config.channel)
        return interaction.reply({
          content: "❌ Farewell messages were already disabled",
          ephemeral: true,
        });

      delete config.channel;
      set(configKey, config);

      embed
        .setTitle("✅ Farewell Disabled")
        .setDescription(`Farewell messages are now disabled`);
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
