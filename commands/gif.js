const {
  SlashCommandBuilder,
  ApplicationIntegrationType,
  InteractionContextType,
  ChatInputCommandInteraction,
  AttachmentBuilder,
} = require("discord.js");
const { default: axios } = require("axios");
const { Worker } = require("worker_threads");
const path = require("path");

const effects = require("../functions/gifEffects");

const data = new SlashCommandBuilder()
  .setName("gif")
  .setDescription("Fun | Generate a GIF with effects")
  .setContexts(
    InteractionContextType.BotDM,
    InteractionContextType.Guild,
    InteractionContextType.PrivateChannel
  )
  .setIntegrationTypes(
    ApplicationIntegrationType.GuildInstall,
    ApplicationIntegrationType.UserInstall
  )
  .addStringOption(option =>
    option
      .setName("effect")
      .setDescription("The effect to apply")
      .setRequired(true)
      .setAutocomplete(true)
  )
  .addAttachmentOption(option =>
    option
      .setName("image")
      .setDescription("The image or GIF to use")
      .setRequired(false)
  )
  .addUserOption(option =>
    option
      .setName("user")
      .setDescription("The user to use as an image")
      .setRequired(false)
  );

function isLinkGIF(link = "") {
  const parts = link.split("/");
  const lastPart = parts[parts.length - 1]; 
  const filename = lastPart.split("?")[0]; 
  return filename.toLowerCase().endsWith(".gif");
}

async function run(interaction = ChatInputCommandInteraction.prototype) {
  const effect = interaction.options.getString("effect");
  const attachment = interaction.options.getAttachment("image");
  const user = interaction.options.getUser("user");

  let targetUrl;
  let isGif = false;

  if (attachment) targetUrl = attachment.url;
  else if (user) targetUrl = user.displayAvatarURL({ size: 512 });
  else if (interaction.client.imageCache.has(interaction.user.id)) {
    targetUrl = interaction.client.imageCache.get(interaction.user.id);
    interaction.client.imageCache.delete(interaction.user.id);
  } else
    return interaction.reply({
      content: '❌ You must specify either "image" or "user"',
      flags: "Ephemeral",
    });

  isGif = isLinkGIF(targetUrl);

  if (typeof effects[effect] !== "function") {
    return interaction.reply({
      content: "❌ Unknown effect option",
      flags: "Ephemeral",
    });
  }

  try {
    await interaction.deferReply();

    const response = await axios.get(targetUrl, {
      responseType: "arraybuffer",
    });
    const inputBuffer = Buffer.from(response.data);

    const gifResult = await new Promise((resolve, reject) => {
      const worker = new Worker(
        path.join(__dirname, "..", "functions", "gifWorker.js"),
        {
          workerData: {
            effect,
            isGif,
            effectsPath: require.resolve("../functions/gifEffects"),
          },
        }
      );

      worker.postMessage(inputBuffer, [inputBuffer.buffer]);

      worker.once("message", msg => {
        if (msg && msg.__ERR) {
          worker.terminate().catch(() => {});
          return reject(new Error(msg.__ERR));
        }
        resolve(msg);
        worker.terminate().catch(() => {});
      });

      worker.once("error", err => {
        worker.terminate().catch(() => {});
        reject(err);
      });

      worker.once("exit", code => {
        if (code !== 0) reject(new Error(`Worker exited with code ${code}`));
      });
    });

    if (gifResult === "only_gif") {
      return await interaction.editReply({
        content: "❌ Only GIF files are supported for this effect",
      });
    }

    const gifBuffer = Buffer.isBuffer(gifResult)
      ? gifResult
      : Buffer.from(gifResult);
    const file = new AttachmentBuilder(gifBuffer, { name: "output.gif" });

    return interaction.editReply({ files: [file] });
  } catch (error) {
    console.error(error);
    const method =
      interaction.deferred || interaction.replied ? "followUp" : "reply";
    return interaction[method]({
      content: "❌ There was an error while processing the GIF",
      flags: "Ephemeral",
    });
  }
}

module.exports = { data, run };
