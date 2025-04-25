const {
  SlashCommandBuilder,
  ApplicationIntegrationType,
  InteractionContextType,
  ChatInputCommandInteraction,
  AttachmentBuilder,
} = require("discord.js");
const { default: axios } = require("axios");

delete require.cache[require.resolve("../functions/imageEffects")];
const effects = require("../functions/imageEffects");

const data = new SlashCommandBuilder()
  .setName("image")
  .setDescription("Fun | Generate an image with effects")
  .setContexts(
    InteractionContextType.BotDM,
    InteractionContextType.Guild,
    InteractionContextType.PrivateChannel
  )
  .setIntegrationTypes(
    ApplicationIntegrationType.GuildInstall,
    ApplicationIntegrationType.UserInstall
  )
  .addStringOption((option) =>
    option
      .setName("effect")
      .setDescription("The effect to apply")
      .setRequired(true)
      .setAutocomplete(true)
  )
  .addAttachmentOption((option) =>
    option
      .setName("image")
      .setDescription("The image or GIF (static) to use")
      .setRequired(false)
  )
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("The user to use as an image")
      .setRequired(false)
  );

async function run(interaction = ChatInputCommandInteraction.prototype) {
  const effect = interaction.options.getString("effect");
  const attachment = interaction.options.getAttachment("image");
  const user = interaction.options.getUser("user");

  let targetUrl;
  if (attachment) {
    targetUrl = attachment.url;
  } else if (user) {
    targetUrl = user.displayAvatarURL({ forceStatic: true, extension: "png" });
  } else if (interaction.client.imageCache.has(interaction.user.id)) {
    targetUrl = interaction.client.imageCache.get(interaction.user.id);
    interaction.client.imageCache.delete(interaction.user.id);
  } else {
    return interaction.reply({
      content: '❌ You must specify one between "image" or "user"',
      flags: "Ephemeral",
    });
  }

  if (typeof effects[effect] !== "function") {
    return interaction.reply({
      content: "❌ Unknown effect option",
      flags: "Ephemeral",
    });
  }

  try {
    await interaction.deferReply();

    const response = await axios.get(targetUrl, { responseType: "arraybuffer" });

    const resultBuffer = await effects[effect](
      Buffer.from(response.data),
      interaction
    );

    if (!resultBuffer) {
      return interaction.editReply({
        content: "❌ Failed to generate an image",
        flags: "Ephemeral",
      });
    }

    const file = new AttachmentBuilder(resultBuffer, { name: "output.png" });
    return interaction.editReply({ files: [file], content: "" });
  } catch (error) {
    console.error(error);

    if (interaction.deferred || interaction.replied) {
      return interaction.followUp({
        content: "❌ Error processing the image",
        flags: "Ephemeral",
      });
    }

    return interaction.reply({
      content: "❌ Error processing the image",
      flags: "Ephemeral",
    });
  }
}

module.exports = { data, run };
