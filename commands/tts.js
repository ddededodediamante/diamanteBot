const { default: axios } = require("axios");
const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AttachmentBuilder,
  InteractionContextType,
  ApplicationIntegrationType,
} = require("discord.js");

const voices = [
  "Brian",
  "Ivy",
  "Justin",
  "Kendra",
  "Kimberly",
  "Matthew",
  "Joey",
  "Joanna",
  "Salli",
];

const data = new SlashCommandBuilder()
  .setName("tts")
  .setDescription("Fun | Convert text to speech with a chosen voice")
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
      .setName("text")
      .setDescription("The text you want to speak")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("voice")
      .setDescription("Voice to use")
      .addChoices(...voices.map((v) => ({ name: v, value: v })))
  );

const run = async (interaction = ChatInputCommandInteraction.prototype) => {
  const text = interaction.options.getString("text");
  const voice =
    interaction.options.getString("voice") ||
    voices[Math.floor(Math.random() * voices.length)];

  const query = new URLSearchParams({ voice, text }).toString();
  const audioUrl = `https://api.streamelements.com/kappa/v2/speech?${query}`;

  try {
    const response = await axios.get(audioUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);

    const attachment = new AttachmentBuilder(buffer, { name: "tts.mp3" });
    await interaction.reply({ files: [attachment] });
  } catch (err) {
    console.error("TTS command failed:", err);
    await interaction.reply({
      content: "❌ Failed to generate TTS.",
      ephemeral: true,
    });
  }
};

module.exports = { data, run };
