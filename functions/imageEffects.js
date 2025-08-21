const { toValidPath } = require("./path");
const { createCanvas, loadImage } = require("@napi-rs/canvas");

async function ddeShirt(buffer) {
  const image = await loadImage(buffer);
  const foreground = await loadImage(toValidPath("../images/dde-shirt.png"));

  const canvas = createCanvas(512, 512);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, 148, 147, 220, 137);
  ctx.drawImage(foreground, 0, 0, 512, 512);

  return canvas.toBuffer("image/png");
}

async function waveDistort(buffer) {
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

async function invert(buffer) {
  const image = await loadImage(buffer);

  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.filter = "invert(1)";
  ctx.drawImage(image, 0, 0, image.width, image.height);

  return canvas.toBuffer("image/png");
}

async function grayscale(buffer) {
  const image = await loadImage(buffer);

  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.filter = "grayscale(1)";
  ctx.drawImage(image, 0, 0, image.width, image.height);

  return canvas.toBuffer("image/png");
}

async function sepia(buffer) {
  const image = await loadImage(buffer);

  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.filter = "sepia(1)";
  ctx.drawImage(image, 0, 0, image.width, image.height);

  return canvas.toBuffer("image/png");
}

async function brighten(buffer) {
  const image = await loadImage(buffer);

  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.filter = "brightness(1.6)";
  ctx.drawImage(image, 0, 0, image.width, image.height);

  return canvas.toBuffer("image/png");
}

async function tombstone(buffer) {
  const image = await loadImage(buffer);
  const background = await loadImage(toValidPath("../images/tombstone.png"));

  const canvas = createCanvas(background.width, background.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(background, 0, 0);
  ctx.drawImage(image, 311, 362, 388, 357);

  return canvas.toBuffer("image/png");
}

async function businessman(buffer) {
  const image = await loadImage(buffer);
  const foreground = await loadImage(toValidPath("../images/businessman.png"));

  const canvas = createCanvas(foreground.width, foreground.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, 162, 41, 79, 103);
  ctx.drawImage(foreground, 0, 0);

  return canvas.toBuffer("image/png");
}

async function jail(buffer) {
  const image = await loadImage(buffer);
  const foreground = await loadImage(toValidPath("../images/jail-bars.png"));

  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, 0, 0);
  ctx.drawImage(foreground, 0, 0, canvas.width, canvas.height);

  return canvas.toBuffer("image/png");
}

async function mosaic(buffer) {
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

async function mosaicInverted(buffer) {
  const image = await loadImage(buffer);

  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  const halfWidth = image.width / 2;
  const halfHeight = image.height / 2;

  ctx.filter = "none";
  ctx.drawImage(image, 0, 0, halfWidth, halfHeight);

  ctx.filter = "invert(1)";
  ctx.drawImage(image, halfWidth, 0, halfWidth, halfHeight);

  ctx.filter = "none";
  ctx.drawImage(image, halfWidth, halfHeight, halfWidth, halfHeight);

  ctx.filter = "invert(1)";
  ctx.drawImage(image, 0, halfHeight, halfWidth, halfHeight);

  return canvas.toBuffer("image/png");
}

async function blur(buffer) {
  const image = await loadImage(buffer);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.filter = "blur(5px)";
  ctx.drawImage(image, 0, 0, image.width, image.height);

  return canvas.toBuffer("image/png");
}

async function emboss(buffer) {
  const image = await loadImage(buffer);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, 0, 0);
  const imgData = ctx.getImageData(0, 0, image.width, image.height);
  const data = imgData.data;
  const w = image.width;

  const kernel = [-2, -1, 0, -1, 1, 1, 0, 1, 2];

  const output = ctx.createImageData(w, image.height);

  for (let y = 1; y < image.height - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let i = (y * w + x) * 4;
      let r = 0,
        g = 0,
        b = 0;
      let k = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * w + (x + kx)) * 4;
          r += data[idx] * kernel[k];
          g += data[idx + 1] * kernel[k];
          b += data[idx + 2] * kernel[k];
          k++;
        }
      }
      output.data[i] = r + 128;
      output.data[i + 1] = g + 128;
      output.data[i + 2] = b + 128;
      output.data[i + 3] = data[i + 3];
    }
  }
  ctx.putImageData(output, 0, 0);
  return canvas.toBuffer("image/png");
}

async function pixelate(buffer) {
  const image = await loadImage(buffer);
  const pixelSize = 10;
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  const smallW = Math.ceil(image.width / pixelSize);
  const smallH = Math.ceil(image.height / pixelSize);
  const temp = createCanvas(smallW, smallH);
  const tctx = temp.getContext("2d");
  tctx.drawImage(image, 0, 0, smallW, smallH);

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(temp, 0, 0, smallW, smallH, 0, 0, image.width, image.height);

  return canvas.toBuffer("image/png");
}

async function vignette(buffer) {
  const image = await loadImage(buffer);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, 0, 0);
  const gradient = ctx.createRadialGradient(
    image.width / 2,
    image.height / 2,
    Math.min(image.width, image.height) / 2.5,
    image.width / 2,
    image.height / 2,
    Math.max(image.width, image.height) / 1
  );
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.7)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, image.width, image.height);

  return canvas.toBuffer("image/png");
}

async function noise(buffer) {
  const image = await loadImage(buffer);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, image.width, image.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const rand = (Math.random() - 0.5) * 50;
    data[i] = data[i] + rand;
    data[i + 1] = data[i + 1] + rand;
    data[i + 2] = data[i + 2] + rand;
  }
  ctx.putImageData(imageData, 0, 0);

  return canvas.toBuffer("image/png");
}

async function contrast(buffer) {
  const image = await loadImage(buffer);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.filter = "contrast(1.5)";
  ctx.drawImage(image, 0, 0);

  return canvas.toBuffer("image/png");
}

async function hueRotate(buffer) {
  const image = await loadImage(buffer);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.filter = "hue-rotate(90deg)";
  ctx.drawImage(image, 0, 0);

  return canvas.toBuffer("image/png");
}

async function redTint(buffer) {
  const image = await loadImage(buffer);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, 0, 0);
  ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
  ctx.fillRect(0, 0, image.width, image.height);

  return canvas.toBuffer("image/png");
}

async function sharpen(buffer) {
  const image = await loadImage(buffer);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, image.width, image.height);
  const data = imageData.data;
  const w = image.width;

  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  const output = ctx.createImageData(w, image.height);

  for (let y = 1; y < image.height - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let i = (y * w + x) * 4;
      let r = 0,
        g = 0,
        b = 0,
        k = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * w + (x + kx)) * 4;
          r += data[idx] * kernel[k];
          g += data[idx + 1] * kernel[k];
          b += data[idx + 2] * kernel[k];
          k++;
        }
      }
      output.data[i] = Math.min(255, Math.max(0, r));
      output.data[i + 1] = Math.min(255, Math.max(0, g));
      output.data[i + 2] = Math.min(255, Math.max(0, b));
      output.data[i + 3] = data[i + 3];
    }
  }

  ctx.putImageData(output, 0, 0);
  return canvas.toBuffer("image/png");
}

async function threshold(buffer) {
  const image = await loadImage(buffer);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, image.width, image.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const val = avg > 128 ? 255 : 0;
    data[i] = data[i + 1] = data[i + 2] = val;
  }
  ctx.putImageData(imageData, 0, 0);

  return canvas.toBuffer("image/png");
}

async function saturation(buffer) {
  const image = await loadImage(buffer);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.filter = "saturate(2)";
  ctx.drawImage(image, 0, 0);

  return canvas.toBuffer("image/png");
}

async function glow(buffer) {
  const image = await loadImage(buffer);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.filter = "blur(8px) brightness(1.3)";
  ctx.drawImage(image, 0, 0);

  ctx.filter = "none";
  ctx.globalAlpha = 0.6;
  ctx.drawImage(image, 0, 0);
  ctx.globalAlpha = 1.0;

  return canvas.toBuffer("image/png");
}

async function swirl(buffer) {
  const image = await loadImage(buffer);
  const { width, height } = image;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const src = ctx.getImageData(0, 0, width, height);
  const dst = ctx.createImageData(width, height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(cx, cy);

  const strength = 0.25;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle =
        Math.atan2(dy, dx) + ((radius - dist) / radius) * Math.PI * strength;
      const sx = Math.round(cx + dist * Math.cos(angle));
      const sy = Math.round(cy + dist * Math.sin(angle));

      if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
        const di = (y * width + x) * 4;
        const si = (sy * width + sx) * 4;
        dst.data[di] = src.data[si];
        dst.data[di + 1] = src.data[si + 1];
        dst.data[di + 2] = src.data[si + 2];
        dst.data[di + 3] = src.data[si + 3];
      }
    }
  }
  ctx.putImageData(dst, 0, 0);
  return canvas.toBuffer("image/png");
}

async function rainbowOverlay(buffer) {
  const image = await loadImage(buffer);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, 0, 0);

  const gradient = ctx.createLinearGradient(0, 0, image.width, image.height);
  gradient.addColorStop(0, "red");
  gradient.addColorStop(0.17, "orange");
  gradient.addColorStop(0.34, "yellow");
  gradient.addColorStop(0.51, "green");
  gradient.addColorStop(0.68, "blue");
  gradient.addColorStop(0.85, "indigo");
  gradient.addColorStop(1, "violet");

  ctx.fillStyle = gradient;
  ctx.globalAlpha = 0.25;
  ctx.fillRect(0, 0, image.width, image.height);
  ctx.globalAlpha = 1.0;

  return canvas.toBuffer("image/png");
}

async function desaturate(buffer) {
  const image = await loadImage(buffer);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.filter = "saturate(0.5)";
  ctx.drawImage(image, 0, 0);
  return canvas.toBuffer("image/png");
}

async function redAndBlueSwap(buffer) {
  const image = await loadImage(buffer);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const imgData = ctx.getImageData(0, 0, image.width, image.height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i],
      b = data[i + 2];
    data[i] = b;
    data[i + 2] = r;
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas.toBuffer("image/png");
}

async function darken(buffer) {
  const image = await loadImage(buffer);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.filter = "brightness(0.6)";
  ctx.drawImage(image, 0, 0);
  return canvas.toBuffer("image/png");
}

async function cat(buffer) {
  const image = await loadImage(buffer);
  const catMask = await loadImage(toValidPath("../images/cat.png"));
  const catFace = await loadImage(toValidPath("../images/cat-face.png"));

  const canvas = createCanvas(512, 512);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, 21, 25, 470, 473);
  ctx.globalCompositeOperation = "destination-in";

  ctx.drawImage(catMask, 0, 0, 512, 512);
  ctx.globalCompositeOperation = "source-over";

  ctx.drawImage(catFace, 0, 0, 512, 512);

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
  mosaic,
  mosaicInverted,
  blur,
  emboss,
  pixelate,
  vignette,
  noise,
  contrast,
  hueRotate,
  redTint,
  sharpen,
  threshold,
  saturation,
  glow,
  swirl,
  rainbowOverlay,
  desaturate,
  redAndBlueSwap,
  darken,
  cat,
};
