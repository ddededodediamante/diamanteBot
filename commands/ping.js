const {
    SlashCommandBuilder,
    ApplicationIntegrationType,
    InteractionContextType,
    CommandInteraction,
  } = require("discord.js");
  
  const data = new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Bot | Shows the bot's ping")
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
    if (interaction.client.ws.ping < 1) {
      await interaction.reply({
        content: '❌ Ping is not available right now',
        flags: "Ephemeral",
      });
    }
  };
  
  module.exports = { data, run };
  