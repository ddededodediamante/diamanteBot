const { toValidPath } = require("./path");
const { createCanvas, loadImage } = require("@napi-rs/canvas");

async function ddeShirt(buffer, _interaction) {
  const image = await loadImage(buffer);
  const foreground = await loadImage(toValidPath("../images/dde-shirt.png"));

  const canvas = createCanvas(512, 512);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, 148, 147, 220, 137);
  ctx.drawImage(foreground, 0, 0, 512, 512);

  return canvas.toBuffer("image/png");
}

async function waveDistort(buffer, _interaction) {
  const amplitude = 10;
  const frequency = 0.05;

  const image = await loadImage(buffer);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, image.width, image.height);
  const data = imageData.data;

  const outputCanvas = createCanvas(image.width, image.height);
  const outputCtx = outputCanvas.getContext("2d");
  const outputImageData = outputCtx.createImageData(image.width, image.height);

  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const offsetX = Math.sin(y * frequency) * amplitude;
      const newX = Math.round(x + offsetX);

      if (newX >= 0 && newX < image.width) {
        const srcIndex = (y * image.width + x) * 4;
        const destIndex = (y * image.width + newX) * 4;

        outputImageData.data[destIndex] = data[srcIndex]; // Red
        outputImageData.data[destIndex + 1] = data[srcIndex + 1]; // Green
        outputImageData.data[destIndex + 2] = data[srcIndex + 2]; // Blue
        outputImageData.data[destIndex + 3] = data[srcIndex + 3]; // Alpha
      }
    }
  }

  outputCtx.putImageData(outputImageData, 0, 0);
  return outputCanvas.toBuffer("image/png");
}

async function invert(buffer, _interaction) {
  const image = await loadImage(buffer);

  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.filter = "invert(1)";
  ctx.drawImage(image, 0, 0, image.width, image.height);

  return canvas.toBuffer("image/png");
}

async function grayscale(buffer, _interaction) {
  const image = await loadImage(buffer);

  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.filter = "grayscale(1)";
  ctx.drawImage(image, 0, 0, image.width, image.height);

  return canvas.toBuffer("image/png");
}

async function sepia(buffer, _interaction) {
  const image = await loadImage(buffer);

  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.filter = "sepia(1)";
  ctx.drawImage(image, 0, 0, image.width, image.height);

  return canvas.toBuffer("image/png");
}

async function brighten(buffer, _interaction) {
  const image = await loadImage(buffer);

  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.filter = "brightness(1.6)";
  ctx.drawImage(image, 0, 0, image.width, image.height);

  return canvas.toBuffer("image/png");
}

async function tombstone(buffer, _interaction) {
  const image = await loadImage(buffer);
  const background = await loadImage(toValidPath("../images/tombstone.png"));

  const canvas = createCanvas(background.width, background.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(background, 0, 0);
  ctx.drawImage(image, 311, 362, 388, 357);

  return canvas.toBuffer("image/png");
}

async function businessman(buffer, _interaction) {
  const image = await loadImage(buffer);
  const foreground = await loadImage(toValidPath("../images/businessman.png"));

  const canvas = createCanvas(foreground.width, foreground.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, 162, 41, 79, 103);
  ctx.drawImage(foreground, 0, 0);

  return canvas.toBuffer("image/png");
}

async function jail(buffer, _interaction) {
  const image = await loadImage(buffer);
  const foreground = await loadImage(toValidPath("../images/jail-bars.png"));

  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, 0, 0);
  ctx.drawImage(foreground, 0, 0, canvas.width, canvas.height);

  return canvas.toBuffer("image/png");
}

async function mosaic(buffer, _interaction) {
  const image = await loadImage(buffer);

  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  const halfWidth = image.width / 2;
  const halfHeight = image.height / 2;

  ctx.drawImage(image, 0, 0, halfWidth, halfHeight);
  ctx.drawImage(image, 0, halfHeight, halfWidth, halfHeight);
  ctx.drawImage(image, halfWidth, 0, halfWidth, halfHeight);
  ctx.drawImage(image, halfWidth, halfHeight, halfWidth, halfHeight);

  return canvas.toBuffer("image/png");
}

module.exports = {
  ddeShirt,
  waveDistort,
  invert,
  grayscale,
  sepia,
  brighten,
  tombstone,
  businessman,
  jail,
  mosaic
};
