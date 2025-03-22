const {
  SlashCommandBuilder,
  ApplicationIntegrationType,
  InteractionContextType,
  CommandInteraction,
  AttachmentBuilder,
} = require("discord.js");
const { default: axios } = require("axios");

delete require.cache[require.resolve("../functions/gifEffects")];
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
  .addStringOption((option) =>
    option
      .setName("effect")
      .setDescription("The effect to apply")
      .setRequired(true)
      .addChoices(
        { name: "rainbow", value: "rainbow" },
        { name: "boykisser", value: "boykisser" },
        { name: "compress", value: "compress" }
      )
  )
  .addAttachmentOption((option) =>
    option
      .setName("image")
      .setDescription("The image or GIF to use")
      .setRequired(true)
  );

const run = async (interaction = CommandInteraction.prototype) => {
  const effect = interaction.options.getString("effect");
  const attachment = interaction.options.getAttachment("image");

  try {
    const imageBuffer = await axios.get(attachment.url, {
      responseType: "arraybuffer",
    });

    let gifBuffer;

    if (typeof effects[effect] !== "function") {
      return interaction.reply({
        content: "❌ Unknown effect option",
        ephemeral: true,
      });
    } else {
      gifBuffer = await effects[effect](
        Buffer.from(imageBuffer.data),
        attachment.contentType,
        interaction
      );
    }

    if (gifBuffer) {
      const gifAttachment = new AttachmentBuilder(
        gifBuffer,
        { name: "output.gif" },
        interaction
      );
      await interaction.editReply({ files: [gifAttachment], content: "" });
    } else {
      await interaction.editReply("❌ Failed to generate GIF");
    }
  } catch (error) {
    console.error(error);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content:"❌ Error processing the gif",
        flags:'Ephemeral'
      });
    } else {
      await interaction.reply({
        content:"❌ Error processing the gif",
        flags:'Ephemeral'
      });
    }
  }
};

module.exports = { data, run };