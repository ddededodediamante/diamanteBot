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
  .setName("welcome")
  .setDescription("Util | Welcome new users with custom messages")
  .setContexts(InteractionContextType.Guild)
  .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
  .addSubcommand((sub) =>
    sub
      .setName("channel")
      .setDescription("Set the channel for welcome messages")
      .addChannelOption((opt) =>
        opt
          .setName("target")
          .setDescription("Channel to send welcome messages")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("role")
      .setDescription("Set a role to give new users")
      .addRoleOption((opt) =>
        opt
          .setName("target")
          .setDescription("The role to give new users when they join")
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("messages")
      .setDescription("Set welcome messages, separated by '/'")
      .addStringOption((opt) =>
        opt
          .setName("string")
          .setDescription("Messages separated by '/', use {user} for username")
          .setRequired(true)
          .setMaxLength(1500)
      )
  )
  .addSubcommand((sub) =>
    sub.setName("disable").setDescription("Disable welcome messages")
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

  const configKey = `welcome.${guild.id}`;
  const config = get(configKey) || {
    messages: ["{user} just joined, say hi!"],
  };

  switch (subcommand) {
    case "channel": {
      const channel = interaction.options.getChannel("target");

      config.channel = channel.id;
      set(configKey, config);

      embed
        .setTitle("✅ Welcome Channel Set")
        .setDescription(`Welcome messages will be sent in ${channel}`);
      break;
    }
    case "role": {
      const role = interaction.options.getRole("target");

      if (
        !interaction.member.permissions.has(
          PermissionsBitField.Flags.ManageRoles
        )
      )
        return interaction.reply({
          content: "❌ You need the `Manage Roles` permission to do this.",
          ephemeral: true,
        });

      const member = await guild.members.fetch(interaction.user.id);
      const me = await guild.members.fetchMe();

      if (role.position >= me.roles.highest.position)
        return interaction.reply({
          content:
            "❌ I can't set a role that is higher or equal than my highest role",
          ephemeral: true,
        });

      if (
        role.position >= member.roles.highest.position &&
        interaction.user.id !== guild.ownerId
      )
        return interaction.reply({
          content:
            "❌ You can't set a role that is higher or equal to your highest role",
          ephemeral: true,
        });

      config.role = role.id;
      set(configKey, config);

      embed
        .setTitle("✅ Auto Role Set")
        .setDescription(`New members will now receive the ${role} role`);
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
        .setTitle("✅ Welcome Messages Set")
        .setDescription(`Saved ${messages.length} message(s)`);
      break;
    }
    case "disable": {
      if (!config || !config.channel)
        return interaction.reply({
          content: "❌ Welcome messages were already disabled",
          ephemeral: true,
        });

      delete config.channel;
      set(configKey, config);

      embed
        .setTitle("✅ Welcome Disabled")
        .setDescription(`Welcome messages are now disabled`);
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
