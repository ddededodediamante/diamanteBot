const {
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  MessageContextMenuCommandInteraction,
} = require("discord.js");

const data = new ContextMenuCommandBuilder()
  .setName("Select Image")
  .setType(ApplicationCommandType.Message);

const run = async (
  interaction = MessageContextMenuCommandInteraction.prototype
) => {
  const message = interaction.targetMessage;

  const img = message.attachments.find(
    (i) =>
      i.contentType?.startsWith("image/") ||
      /\.(jpe?g|png|gif)$/i.test(i.name)
  );

  if (!img) {
    return await interaction.reply({
      content: "❌ No image found in that message.",
      flags: "Ephemeral",
    });
  }

  interaction.client.imageCache.set(interaction.user.id, img.url);

  await interaction.reply({
    content: "✅ Image saved for your next `/image` or `/gif` call.",
    flags: "Ephemeral",
  });
};

module.exports = { data, run };
