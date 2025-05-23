const {
  SlashCommandBuilder,
  ApplicationIntegrationType,
  InteractionContextType,
  EmbedBuilder,
  codeBlock,
  ChatInputCommandInteraction,
} = require("discord.js");

const data = new SlashCommandBuilder()
  .setName("slashregister")
  .setDescription("Owner | Register Slash Commands")
  .setContexts(
    InteractionContextType.BotDM,
    InteractionContextType.Guild,
    InteractionContextType.PrivateChannel
  )
  .setIntegrationTypes(
    ApplicationIntegrationType.GuildInstall,
    ApplicationIntegrationType.UserInstall
  );

const run = async (interaction = ChatInputCommandInteraction.prototype) => {
  if (interaction.user.id !== "694587798598058004") {
    return await interaction.reply({
      content: "❌ Not enough permissions",
      flags: "Ephemeral",
    });
  } else {
    await client.registerSlashCommands();
    return await interaction.reply({
      content: "✅ Commands registered",
      flags: "Ephemeral",
    });
  }
};

module.exports = { data, run };
