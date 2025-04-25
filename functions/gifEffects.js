const { toValidPath } = require('./path');
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const GIFEncoder = require("gifencoder");
const gifFrames = require("gif-frames");

if (typeof document === "undefined") {
  global.document = {
    createElement: () => {
      return createCanvas(100, 100);
    },
  };
}

async function loadFrames(buffer, isGif) {
  return isGif
    ? await gifFrames({
      url: buffer,
      frames: "all",
      outputType: "canvas",
      cumulative: true,
    })
    : await loadImage(buffer);
}

async function rainbow(buffer, contentType, interaction) {
  const isGif = String(contentType).split("/").at(-1) === "gif";
  const frames = await loadFrames(buffer, isGif);

  const width = isGif ? frames[0].frameInfo.width : frames.width;
  const height = isGif ? frames[0].frameInfo.height : frames.height;

  const framesLength = Array.isArray(frames) ? frames.length : 30;
  await interaction.editReply(
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

    if (isGif) encoder.setDelay((frames[i]?.frameInfo?.delay ?? 5) * 10);
    encoder.addFrame(ctx);
  }

  encoder.finish();
  return encoder.out.getData();
}

async function boykisser(buffer, contentType, interaction) {
  const spriteImage = await loadImage(toValidPath("../images/boykisser.png"));
  const spriteWidth = 465;
  const spriteHeight = 498;
  const spriteCount = 22;

  const isGif = String(contentType).split("/").at(-1) === "gif";
  const frames = await loadFrames(buffer, isGif);

  const framesLength = Array.isArray(frames) ? frames.length : 1;

  await interaction.editReply(
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
    await interaction.editReply({ content:"Only GIF files are supported for this effect.", flags:'Ephemeral' });
    return 'cancel';
  }

  const frames = await loadFrames(buffer, true);

  const width = Math.max(1, frames[0].frameInfo.width / 2);
  const height = Math.max(1, frames[0].frameInfo.height / 2);

  const framesLength = frames.length;
  await interaction.editReply(`Compressing frames... (Total frames: ${framesLength})`);

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

async function waveDistortAnimated(buffer, contentType, interaction) {
  const isGif = String(contentType).split("/").at(-1) === "gif";
  const frames = await loadFrames(buffer, isGif);

  const width = isGif ? frames[0].frameInfo.width : frames.width;
  const height = isGif ? frames[0].frameInfo.height : frames.height;

  const framesLength = Array.isArray(frames) ? frames.length : 30;

  await interaction.editReply(
    `Processing frames... (Total frames: ${framesLength})`
  );

  const encoder = new GIFEncoder(width, height);
  encoder.setRepeat(0);
  encoder.setQuality(17);
  encoder.setTransparent(0x00000000);
  encoder.setDelay(isGif ? 0 : 40);
  encoder.start();

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const amplitude = 10;
  const frequency = 0.05;

  for (let i = 0; i < framesLength; i++) {
    ctx.clearRect(0, 0, width, height);

    const frame = isGif ? await frames[i].getImage() : frames;
    ctx.drawImage(frame, 0, 0);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const outputCanvas = createCanvas(width, height);
    const outputCtx = outputCanvas.getContext("2d");
    const outputImageData = outputCtx.createImageData(width, height);

    const phaseOffset = (i / framesLength) * 2 * Math.PI;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const offsetX = Math.sin(y * frequency + phaseOffset) * amplitude;
        const newX = Math.round(x + offsetX);

        if (newX >= 0 && newX < width) {
          const srcIndex = (y * width + x) * 4;
          const destIndex = (y * width + newX) * 4;

          outputImageData.data[destIndex] = data[srcIndex];
          outputImageData.data[destIndex + 1] = data[srcIndex + 1];
          outputImageData.data[destIndex + 2] = data[srcIndex + 2];
          outputImageData.data[destIndex + 3] = data[srcIndex + 3];
        }
      }
    }

    outputCtx.putImageData(outputImageData, 0, 0);
    if (isGif) encoder.setDelay((frames[i]?.frameInfo?.delay ?? 5) * 10);
    encoder.addFrame(outputCtx);
  }

  encoder.finish();
  return encoder.out.getData();
}

async function violentSquish(buffer, contentType, interaction) {
  const isGif = String(contentType).split("/").at(-1) === "gif";
  const frames = await loadFrames(buffer, isGif);

  const width = isGif ? frames[0].frameInfo.width : frames.width;
  const height = isGif ? frames[0].frameInfo.height : frames.height;
  const framesLength = Array.isArray(frames) ? frames.length : 20;

  await interaction.editReply(`processing frames... (total frames: ${framesLength})`);

  const encoder = new GIFEncoder(width, height);
  encoder.setRepeat(0);
  encoder.setQuality(17);
  encoder.setTransparent(0x00000000);
  encoder.setDelay(isGif ? 0 : 30);
  encoder.start();

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  for (let i = 0; i < framesLength; i++) {
    ctx.clearRect(0, 0, width, height);

    const frame = isGif ? await frames[i].getImage() : frames;

    const scaleX = Math.random() * 0.3 + 0.7;
    const scaleY = Math.random() * 0.3 + 0.7;

    const newWidth = width * scaleX;
    const newHeight = height * scaleY;

    const posX = (width - newWidth) / 2;
    const posY = height - newHeight;

    ctx.drawImage(frame, posX, posY, newWidth, newHeight);

    if (isGif) encoder.setDelay((frames[i]?.frameInfo?.delay ?? 5) * 10);
    encoder.addFrame(ctx);
  }

  encoder.finish();
  return encoder.out.getData();
}

async function rotate(buffer, contentType, interaction) {
  const isGif = String(contentType).split("/").at(-1) === "gif";
  const frames = await loadFrames(buffer, isGif);

  const width = isGif ? frames[0].frameInfo.width : frames.width;
  const height = isGif ? frames[0].frameInfo.height : frames.height;
  const framesLength = Array.isArray(frames) ? frames.length : 30;

  await interaction.editReply(`processing frames... (total frames: ${framesLength})`);

  const encoder = new GIFEncoder(width, height);
  encoder.setRepeat(0);
  encoder.setQuality(17);
  encoder.setDelay(isGif ? 0 : 50);
  encoder.start();

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const centerX = width / 2;
  const centerY = height / 2;

  for (let i = 0; i < framesLength; i++) {
    ctx.clearRect(0, 0, width, height);
    const frame = isGif ? await frames[i].getImage() : frames;

    const angle = (i / framesLength) * 2 * Math.PI;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    ctx.drawImage(frame, -centerX, -centerY, width, height);
    ctx.restore();

    if (isGif) encoder.setDelay((frames[i]?.frameInfo?.delay ?? 5) * 10);
    encoder.addFrame(ctx);
  }

  encoder.finish();
  return encoder.out.getData();
}

async function rotateCounterclockwise(buffer, contentType, interaction) {
  const isGif = String(contentType).split("/").at(-1) === "gif";
  const frames = await loadFrames(buffer, isGif);

  const width = isGif ? frames[0].frameInfo.width : frames.width;
  const height = isGif ? frames[0].frameInfo.height : frames.height;
  const framesLength = Array.isArray(frames) ? frames.length : 30;

  await interaction.editReply(`processing frames... (total frames: ${framesLength})`);

  const encoder = new GIFEncoder(width, height);
  encoder.setRepeat(0);
  encoder.setQuality(17);
  encoder.setDelay(isGif ? 0 : 50);
  encoder.start();

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const centerX = width / 2;
  const centerY = height / 2;

  for (let i = 0; i < framesLength; i++) {
    ctx.clearRect(0, 0, width, height);
    const frame = isGif ? await frames[i].getImage() : frames;

    const angle = -(i / framesLength) * 2 * Math.PI;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    ctx.drawImage(frame, -centerX, -centerY, width, height);
    ctx.restore();

    if (isGif) encoder.setDelay((frames[i]?.frameInfo?.delay ?? 5) * 10);
    encoder.addFrame(ctx);
  }

  encoder.finish();
  return encoder.out.getData();
}

module.exports = {
  rainbow,
  boykisser,
  compress,
  waveDistortAnimated,
  violentSquish,
  rotate,
  rotateCounterclockwise
};
