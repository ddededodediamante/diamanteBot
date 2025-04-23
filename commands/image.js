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

async function run(interaction = CommandInteraction.prototype) {
  const effect = interaction.options.getString("effect");
  const attachment = interaction.options.getAttachment("image");
  const user = interaction.options.getUser("user");

  if (!attachment && !user) {
    return interaction.reply({
      content: '❌ You must specify one between "image" or "user"',
      flags: 'Ephemeral',
    });
  }

  if (typeof effects[effect] !== "function") {
    return interaction.reply({
      content: "❌ Unknown effect option",
      flags: 'Ephemeral',
    });
  }

  try {
    await interaction.deferReply();

    const url = attachment
      ? attachment.url
      : user.displayAvatarURL({ forceStatic: true, extension: "png" });
      
    const response = await axios.get(url, { responseType: "arraybuffer" });

    const resultBuffer = await effects[effect](
      Buffer.from(response.data),
      interaction
    );

    if (!resultBuffer) {
      return interaction.editReply({
        content: "❌ Failed to generate an image",
        flags: 'Ephemeral',
      });
    }

    const file = new AttachmentBuilder(resultBuffer, { name: "output.png" });
    return interaction.editReply({ files: [file], content: '' });
  } catch (error) {
    console.error(error);

    if (interaction.deferred || interaction.replied) {
      return interaction.followUp({
        content: "❌ Error processing the image",
        flags: 'Ephemeral',
      });
    } 

    return interaction.reply({
      content: "❌ Error processing the image",
      flags: 'Ephemeral',
    });
  }
}

module.exports = { data, run };
