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
  .setName("wordstory")
  .setDescription("Util | Configure the word story channel")
  .setContexts(InteractionContextType.Guild)
  .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
  .addSubcommand(sub =>
    sub
      .setName("channel")
      .setDescription("Set the word story channel")
      .addChannelOption(opt =>
        opt
          .setName("target")
          .setDescription("Channel for the word story")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName("settings")
      .setDescription("Configure word story settings")
      .addIntegerOption(opt =>
        opt
          .setName("words")
          .setDescription("Words allowed per user")
          .setMinValue(1)
          .setMaxValue(10)
      )
      .addBooleanOption(opt =>
        opt
          .setName("remove-on-delete")
          .setDescription("Remove story part when message is deleted")
      )
  )
  .addSubcommand(sub =>
    sub.setName("disable").setDescription("Disable the word story")
  )
  .addSubcommand(sub =>
    sub.setName("view").setDescription("View the full word story")
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

      if (serverConfig.wordStory.channel !== channel.id)
        serverConfig.wordStory.messages = [];
      serverConfig.wordStory.channel = channel.id;
      serverConfig.wordStory.lastUser = null;

      await serverConfig.save();

      embed
        .setTitle("✅ Word Story Channel Set")
        .setDescription(`Word story enabled in ${channel}`);
      break;
    }
    case "settings": {
      let words = interaction.options.getInteger("words");
      let removeOnDelete = interaction.options.getBoolean("remove-on-delete");

      if (words === null && removeOnDelete === null) {
        return await interaction.reply({
          content: "❌ No settings were modified",
          flags: "Ephemeral",
        });
      }

      words = words ?? 1;
      removeOnDelete = removeOnDelete ?? true;

      serverConfig.wordStory.wordsPerUser = words;
      serverConfig.wordStory.removeOnDelete = removeOnDelete;
      await serverConfig.save();

      embed
        .setTitle("✅ Word Story Settings Updated")
        .setDescription(
          `Words per user: **${words}**\nRemove on delete: **${
            removeOnDelete ? "Yes" : "No"
          }**`
        );
      break;
    }
    case "view": {
      const messages = serverConfig.wordStory.messages;

      if (!messages?.length)
        return interaction.reply({
          content: "❌ The word story is currently empty",
          flags: "Ephemeral",
        });

      const story = messages.map(m => m.content).join(" ");

      embed
        .setTitle("📖 Word Story")
        .setDescription(
          story.length > 2000 ? story.slice(0, 1999) + "…" : story
        );

      if (interaction.channel.id === serverConfig.wordStory.channel) {
        return interaction.reply({ embeds: [embed], flags: "Ephemeral" });
      }

      return interaction.reply({ embeds: [embed] });
    }
    case "disable": {
      if (!serverConfig.wordStory.channel)
        return interaction.reply({
          content: "❌ Word story is already disabled",
          flags: "Ephemeral",
        });

      serverConfig.wordStory.channel = null;
      serverConfig.wordStory.lastUser = null;
      serverConfig.wordStory.messages = [];
      await serverConfig.save();

      embed
        .setTitle("✅ Word Story Disabled")
        .setDescription("The word story has been disabled");
      break;
    }
    default:
      return interaction.reply({
        content: "❌ Unknown subcommand",
        flags: "Ephemeral",
      });
  }

  embed.setFooter({ text: `Guild ID: ${guild.id}` });
  embed.setColor("Green");

  return interaction.reply({ embeds: [embed] });
};

module.exports = { data, run };
