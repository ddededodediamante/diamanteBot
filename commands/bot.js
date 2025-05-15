const {
  SlashCommandBuilder,
  ApplicationIntegrationType,
  InteractionContextType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  version,
} = require("discord.js");
const os = require("os");

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

const run = async (interaction = ChatInputCommandInteraction.prototype) => {
  const { client } = interaction;

  const app = await client.application.fetch();
  const owner = app.owner?.name ?? app.owner?.username;

  const uptime = Math.floor(client.uptime / 1000);
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds) parts.push(`${seconds}s`);

  const uptimeString = parts.join(" ");

  const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

  const cpuModel = os.cpus()[0].model;
  const osInfo = `${os.type()} (${os.arch()})`;

  const embed = new EmbedBuilder()
    .setTitle("Bot Information")
    .addFields(
      {
        name: "Statistics",
        value:
          `**Servers:** ${client.guilds.cache.size.toLocaleString()}\n` +
          `**Users:** ${client.users.cache.size.toLocaleString()}\n` +
          `**Bot Uptime:** ${uptimeString}\n` +
          `**Ping:** ${
            client.ws.ping === -1 ? "Loading..." : client.ws.ping + "ms"
          }\n`,
        inline: false,
      },
      {
        name: "Software",
        value:
          `<:discordjs:1365170283568169002> **Discord.js:** v${version}\n` +
          `<:nodejs:1365170327063363645> **Node.js:** ${process.version}`,
        inline: false,
      },
      {
        name: "Hosting",
        value:
          `**OS:** ${osInfo}\n` +
          `**CPU:** ${cpuModel}\n` +
          `**Memory Usage:** ${memoryUsage} MB`,
        inline: false,
      }
    )
    .setFooter({ text: `Made by ${owner}` });

  await interaction.reply({ embeds: [embed] });
};

module.exports = { data, run };
