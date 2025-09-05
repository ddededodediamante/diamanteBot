const {
  AttachmentBuilder,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ApplicationIntegrationType,
  InteractionContextType,
} = require("discord.js");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const { toValidPath } = require("../functions/path");

const data = new SlashCommandBuilder()
  .setName("ship")
  .setDescription("Fun | Calculate compatibility between two users")
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

function generateShipName(user1, user2) {
  const name1 = user1.displayName;
  const name2 = user2.displayName;

  const firstHalf = name1.slice(0, Math.ceil(name1.length / 2));
  const secondHalf = name2.slice(Math.floor(name2.length / 2));

  return firstHalf + secondHalf;
}

async function generateShipImage(user1, user2, compatibility) {
  const brokenheart = await loadImage(toValidPath("../images/broken-heart.svg"));
  const heart = await loadImage(toValidPath("../images/heart.svg"));
  const revolvinghearts = await loadImage(toValidPath("../images/revolving-hearts.svg"));

  let heartImage;
  if (compatibility <= 35) heartImage = brokenheart;
  else if (compatibility <= 70) heartImage = heart;
  else heartImage = revolvinghearts;

  const avatar1 = await loadImage(user1.displayAvatarURL({ extension: "png", size: 256 }));
  const avatar2 = await loadImage(user2.displayAvatarURL({ extension: "png", size: 256 }));

  const canvas = createCanvas(700, 250);
  const ctx = canvas.getContext("2d");

  // draw first avatar
  ctx.save();
  ctx.beginPath();
  ctx.arc(125, 125, 100, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar1, 25, 25, 200, 200);
  ctx.restore();

  // draw second avatar
  ctx.save();
  ctx.beginPath();
  ctx.arc(575, 125, 100, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar2, 475, 25, 200, 200);
  ctx.restore();

  // draw heart
  ctx.drawImage(heartImage, canvas.width / 2 - 75, canvas.height / 2 - 75, 150, 150);

  // draw compatibility percentage
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 40px Sans-serif"; // changed font to a safe one
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${compatibility}%`, canvas.width / 2, canvas.height / 2);

  // draw ship name
  const shipName = generateShipName(user1, user2);
  ctx.font = "bold 30px Sans-serif";
  ctx.fillText(shipName, canvas.width / 2, canvas.height - 30);

  return new AttachmentBuilder(await canvas.encode("png"), { name: "ship.png" });
}

const run = async (interaction = ChatInputCommandInteraction.prototype) => {
  const user1 = interaction.options.getUser("user1");
  const user2 = interaction.options.getUser("user2");

  const compatibility = calculateCompatibility(user1.id, user2.id);
  const image = await generateShipImage(user1, user2, compatibility);

  await interaction.reply({
    content: `❤️ Compatibility between ${user1} and ${user2}...`,
    files: [image],
    allowedMentions: { parse: [] },
  });
};

module.exports = { data, run };
