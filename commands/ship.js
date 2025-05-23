const {
  AttachmentBuilder,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ApplicationIntegrationType,
  InteractionContextType,
} = require("discord.js");
const { createCanvas, loadImage } = require("@napi-rs/canvas");

const data = new SlashCommandBuilder()
  .setName("ship")
  .setDescription("Calculate compatibility between two users!")
  .setContexts(
    InteractionContextType.BotDM,
    InteractionContextType.Guild,
    InteractionContextType.PrivateChannel
  )
  .setIntegrationTypes(
    ApplicationIntegrationType.GuildInstall,
    ApplicationIntegrationType.UserInstall
  )
  .addUserOption((option) =>
    option.setName("user1").setDescription("First user").setRequired(true)
  )
  .addUserOption((option) =>
    option.setName("user2").setDescription("Second user").setRequired(true)
  );

function calculateCompatibility(user1Id, user2Id) {
  const str = user1Id.toString() + user2Id.toString();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const percentage = Math.abs(hash % 101);
  return percentage;
}

async function generateShipImage(user1, user2, compatibility) {
  const canvas = createCanvas(700, 250);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#2C2F33";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const avatar1 = await loadImage(
    user1.displayAvatarURL({ extension: "png", size: 256 })
  );
  const avatar2 = await loadImage(
    user2.displayAvatarURL({ extension: "png", size: 256 })
  );

  ctx.save();
  ctx.beginPath();
  ctx.arc(125, 125, 100, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar1, 25, 25, 200, 200);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(575, 125, 100, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar2, 475, 25, 200, 200);
  ctx.restore();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "40px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${compatibility}%`, canvas.width / 2, canvas.height / 2);

  return new AttachmentBuilder(await canvas.encode("png"), {
    name: "ship.png",
  });
}

const run = async (interaction = ChatInputCommandInteraction.prototype) => {
  const user1 = interaction.options.getUser("user1");
  const user2 = interaction.options.getUser("user2");

  const compatibility = calculateCompatibility(user1.id, user2.id);
  const image = await generateShipImage(user1, user2, compatibility);

  await interaction.reply({
    content: `❤️ Compatibility between ${user1} and ${user2}...`,
    files: [image],
    allowedMentions: { parse: [], repliedUser: true },
  });
};

module.exports = { data, run };
