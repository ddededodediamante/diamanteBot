const { createCanvas, loadImage } = require("canvas");

async function dde_shirt(buffer, interaction) {
  await interaction.deferReply();

  const image = await loadImage(buffer);
  const foreground = await loadImage('./images/dde-shirt.png');

  const canvas = createCanvas(512, 512);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, 148, 147, 220, 137);
  ctx.drawImage(foreground, 0, 0, 512, 512);

  return canvas.toBuffer();
}

async function waveDistort(buffer, interaction) {
  await interaction.deferReply();

  const amplitude = 10;
  const frequency = 0.05;

  const image = await loadImage(buffer);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, image.width, image.height);
  const data = imageData.data;

  const outputCanvas = createCanvas(image.width, image.height);
  const outputCtx = outputCanvas.getContext('2d');
  const outputImageData = outputCtx.createImageData(image.width, image.height);

  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const offsetX = Math.sin(y * frequency) * amplitude;
      const newX = Math.round(x + offsetX);

      if (newX >= 0 && newX < image.width) {
        const srcIndex = (y * image.width + x) * 4;
        const destIndex = (y * image.width + newX) * 4;

        outputImageData.data[destIndex] = data[srcIndex];         // Red
        outputImageData.data[destIndex + 1] = data[srcIndex + 1]; // Green
        outputImageData.data[destIndex + 2] = data[srcIndex + 2]; // Blue
        outputImageData.data[destIndex + 3] = data[srcIndex + 3]; // Alpha
      }
    }
  }

  outputCtx.putImageData(outputImageData, 0, 0);
  return outputCanvas.toBuffer();
}

module.exports = { dde_shirt, waveDistort };
