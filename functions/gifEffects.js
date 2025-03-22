const { createCanvas, loadImage } = require("canvas");
const GIFEncoder = require("gifencoder");
const gifFrames = require("gif-frames");

if (typeof document === "undefined") {
  global.document = {
    createElement: () => {
      return createCanvas(100, 100);
    },
  };
}

async function rainbow(buffer, contentType, interaction) {
  const isGif = String(contentType).split("/").at(-1) === "gif";
  const frames = isGif
    ? await gifFrames({
        url: buffer,
        frames: "all",
        outputType: "canvas",
        cumulative: true,
      })
    : await loadImage(buffer);

  const width = isGif ? frames[0].frameInfo.width : frames.width;
  const height = isGif ? frames[0].frameInfo.height : frames.height;

  const framesLength = Array.isArray(frames) ? frames.length : 30;
  await interaction.reply(
    `Processing frames... (Total frames: ${framesLength})`
  );

  const encoder = new GIFEncoder(width, height);
  encoder.setRepeat(0);
  encoder.setQuality(17);
  encoder.setTransparent(0x00000000);
  encoder.setDelay(isGif ? 0 : 60);
  encoder.start();

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.globalCompositeOperation = "source-over";

  for (let i = 0; i < framesLength; i++) {
    ctx.clearRect(0, 0, width, height);

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "destination-over";

    ctx.drawImage(isGif ? await frames[i].getImage() : frames, 0, 0, width, height);

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = `hsl(${(i / (framesLength - 1)) * 360}, 100%, 50%)`;
    ctx.fillRect(0, 0, width, height);

    encoder.setDelay((isGif ? frames[i]?.frameInfo?.delay ?? 5 : 5) * 10);
    encoder.addFrame(ctx);
  }

  encoder.finish();
  return encoder.out.getData();
}

async function boykisser(buffer, contentType, interaction) {
  const spriteImage = await loadImage("./images/boykisser.png");
  const spriteWidth = 465;
  const spriteHeight = 498;
  const spriteCount = 22;

  const isGif = String(contentType).split("/").at(-1) === "gif";
  const frames = isGif
    ? await gifFrames({
        url: buffer,
        frames: "all",
        outputType: "canvas",
        cumulative: true,
      })
    : await loadImage(buffer);

  const framesLength = Array.isArray(frames) ? frames.length : 1;

  await interaction.reply(
    `Processing frames... (Total frames: ${spriteCount})`
  );

  const encoder = new GIFEncoder(spriteWidth, spriteHeight);
  encoder.setRepeat(0);
  encoder.setQuality(17);
  encoder.setTransparent(0x00000000);
  encoder.setDelay(100);
  encoder.start();

  const canvas = createCanvas(spriteWidth, spriteHeight);
  const ctx = canvas.getContext("2d");

  for (let i = 0; i < 22; i++) {
    const frame = isGif ? await frames[framesLength > 44 ? (i * 2) % framesLength : i % framesLength].getImage() : frames;

    ctx.clearRect(0, 0, spriteWidth, spriteHeight);

    ctx.drawImage(
      spriteImage, // Image
      (i % spriteCount) * spriteWidth, // Source X (cycling sprite)
      0, // Source Y
      spriteWidth, // Source Width
      spriteHeight, // Source Height
      0, // Dest X
      0, // Dest Y
      spriteWidth, // Dest Width
      spriteHeight // Dest Height
    );

    ctx.drawImage(frame, 343, 12, 110, 69);
    ctx.drawImage(frame, 183, 70, 75, 59);

    encoder.addFrame(ctx);
  }

  encoder.finish();
  return encoder.out.getData();
}

async function compress(buffer, contentType, interaction) {
  if (String(contentType).split("/").at(-1) !== "gif") {
    throw new Error("Only GIF files are supported.");
  }

  const frames = await gifFrames({
    url: buffer,
    frames: "all",
    outputType: "canvas",
    cumulative: true,
  });

  const width = Math.max(1, frames[0].frameInfo.width / 2);
  const height = Math.max(1, frames[0].frameInfo.height / 2);

  const framesLength = frames.length;
  await interaction.reply(`Compressing frames... (Total frames: ${framesLength})`);

  const encoder = new GIFEncoder(width, height);
  encoder.setRepeat(0);
  encoder.setQuality(50);
  encoder.setTransparent(0x00000000);
  encoder.setDelay(0);
  encoder.start();

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  for (let i = 0; i < framesLength; i++) {
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(await frames[i].getImage(), 0, 0, width, height);
    encoder.setDelay((frames[i].frameInfo.delay ?? 5) * 10);
    encoder.addFrame(ctx);
  }

  encoder.finish();
  return encoder.out.getData();
}

module.exports = { rainbow, boykisser, compress };
