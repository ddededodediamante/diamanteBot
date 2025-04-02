const {
    SlashCommandBuilder,
    ApplicationIntegrationType,
    InteractionContextType,
    CommandInteraction
} = require("discord.js");

const data = new SlashCommandBuilder()
    .setName("yomama")
    .setDescription("Fun | yo mama")
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
    await interaction.reply('yo mama so big that she');
};

module.exports = { data, run };
