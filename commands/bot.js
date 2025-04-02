const {
    SlashCommandBuilder,
    ApplicationIntegrationType,
    InteractionContextType,
    CommandInteraction,
    EmbedBuilder,
    version
} = require("discord.js");
const os = require('os');

const data = new SlashCommandBuilder()
    .setName("bot")
    .setDescription("Bot | Shows information about the bot")
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
    const { client } = interaction;

    const app = await client.application.fetch();
    const owner = app.owner?.tag || 'Unknown';

    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    const uptimeString = `${hours}h ${minutes}m ${seconds}s`;

    const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

    const cpuModel = os.cpus()[0].model;
    const osInfo = `${os.type()} (${os.arch()})`;
    const hostUptime = `${Math.floor(os.uptime() / 3600)}h ${Math.floor((os.uptime() % 3600) / 60)}m`;

    const embed = new EmbedBuilder()
        .setTitle('Bot Information')
        .addFields(
            {
                name: 'Statistics',
                value: `**Servers:** ${client.guilds.cache.size.toLocaleString()}\n`
                    + `**Users:** ${client.users.cache.size.toLocaleString()}\n`
                    + `**Uptime:** ${uptimeString}\n`
                    + `**Ping:** ${client.ws.ping}ms\n`,
                inline: false
            },
            {
                name: 'Software',
                value: `<:discordjs:1353208449865093180> **Discord.js:** v${version}\n`
                    + `<:NodeJS:1322134480546168902> **Node.js:** ${process.version}`,
                inline: false
            },
            {
                name: 'Hosting',
                value: `**OS:** ${osInfo}\n`
                    + `**CPU:** ${cpuModel}\n`
                    + `**Host Uptime:** ${hostUptime}\n`
                    + `**Memory Usage:** ${memoryUsage} MB`,
                inline: false
            }
        )
        .setFooter({ text: `Made by ${owner}` });

    await interaction.reply({ embeds: [embed] });
};

module.exports = { data, run };
