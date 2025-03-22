const {
  SlashCommandBuilder,
  ApplicationIntegrationType,
  InteractionContextType,
  CommandInteraction,
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
      .addChoices(
        { name: "dde's shirt", value: "dde_shirt" },
        { name: "wave distort", value: "waveDistort" }
      )
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
  );;

const run = async (interaction = CommandInteraction.prototype) => {
  const effect = interaction.options.getString("effect");
  const attachment = interaction.options.getAttachment("image");
  const user = interaction.options.getUser("user");

  if (!attachment && !user) return interaction.reply({
    content: '❌ You must specify one between "image" or "user"',
    ephemeral: true,
  });

  try {
    const imageBuffer = await axios.get(attachment ? attachment.url : user.displayAvatarURL({ forceStatic: true, extension: 'png' }), {
      responseType: "arraybuffer",
    });

    let resultBuffer;

    if (typeof effects[effect] !== "function") {
      return interaction.reply({
        content: "❌ Unknown effect option",
        ephemeral: true,
      });
    } else {
      resultBuffer = await effects[effect](
        Buffer.from(imageBuffer.data),
        interaction
      );
    }

    if (resultBuffer) {
      const imageAttachment = new AttachmentBuilder(
        resultBuffer,
        { name: "output.png" },
        interaction
      );
      await interaction.editReply({ files: [imageAttachment], content: "" });
    } else {
      await interaction.editReply("❌ Failed to generate an image");
    }
  } catch (error) {
    console.error(error);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "❌ Error processing the image",
        flags: 'Ephemeral'
      });
    } else {
      await interaction.reply({
        content: "❌ Error processing the image",
        flags: 'Ephemeral'
      });
    }
  }
};

module.exports = { data, run };