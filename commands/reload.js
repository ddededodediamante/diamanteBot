const {
  SlashCommandBuilder,
  ApplicationIntegrationType,
  InteractionContextType,
  CommandInteraction,
} = require("discord.js");

const data = new SlashCommandBuilder()
  .setName("reload")
  .setDescription("Owner | Reloads stuff")
  .setContexts(
    InteractionContextType.BotDM,
    InteractionContextType.Guild,
    InteractionContextType.PrivateChannel
  )
  .setIntegrationTypes(
    ApplicationIntegrationType.GuildInstall,
    ApplicationIntegrationType.UserInstall
  );

const run = async (interaction = CommandInteraction.prototype) => {
  if (interaction.user.id !== "694587798598058004")
    return await interaction.reply({
      content: "❌ Not enough permissions",
      flags: "Ephemeral",
    });

  if (typeof interaction.client?.loadCommands !== 'function')
    await interaction.reply({
      content: '❌ Client is missing "loadCommands" function',
      flags: "Ephemeral",
    });

  interaction.client.loadCommands();

  await interaction.reply({
    content: '✅ Reloaded succesfully',
    flags: "Ephemeral",
  });
};

module.exports = { data, run };
