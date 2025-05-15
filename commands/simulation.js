const {
  AttachmentBuilder,
  SlashCommandBuilder,
  ApplicationIntegrationType,
  InteractionContextType,
  ChatInputCommandInteraction,
} = require("discord.js");
const { createCanvas } = require("@napi-rs/canvas");
const ffmpegPath = require("ffmpeg-static");
const { spawn } = require("child_process");
const Matter = require("matter-js");
const fs = require("fs");
const path = require("path");

const data = new SlashCommandBuilder()
  .setName("simulation")
  .setDescription(
    "Generates a random 5 seconds physics simulation video with collision sounds"
  )
  .setContexts(
    InteractionContextType.BotDM,
    InteractionContextType.Guild,
    InteractionContextType.PrivateChannel
  )
  .setIntegrationTypes(
    ApplicationIntegrationType.GuildInstall,
    ApplicationIntegrationType.UserInstall
  );

async function run(interaction = ChatInputCommandInteraction.prototype) {
  await interaction.deferReply();

  const width = 500;
  const height = 300;
  const duration = 5;
  const fps = 30;
  const totalFrames = duration * fps;

  const outputPath = path.join(__dirname, "..", `sim-${Date.now()}.mp4`);
  if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const engine = Matter.Engine.create();
  const world = engine.world;

  const walls = [
    Matter.Bodies.rectangle(width / 2, -10, width, 20, { isStatic: true }),
    Matter.Bodies.rectangle(width / 2, height + 10, width, 20, {
      isStatic: true,
    }),
    Matter.Bodies.rectangle(-10, height / 2, 20, height, { isStatic: true }),
    Matter.Bodies.rectangle(width + 10, height / 2, 20, height, {
      isStatic: true,
    }),
  ];
  Matter.World.add(world, walls);

  const balls = [];
  for (let i = 0; i < 6; i++) {
    const r = Math.random() * 15 + 10;
    const ball = Matter.Bodies.circle(
      Math.random() * (width - 2 * r) + r,
      Math.random() * (height - 2 * r) + r,
      r,
      {
        restitution: 1.1,
        friction: 0.01,
        density: 0.5,
      }
    );
    ball.render = { color: `hsl(${Math.random() * 360}, 80%, 60%)` };

    const speed = 3;
    const angle = Math.random() * 2 * Math.PI;
    Matter.Body.setVelocity(ball, {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    });

    balls.push(ball);
    Matter.World.add(world, ball);
  }

  const ballIds = new Set(balls.map((b) => b.id));
  const collisionTimes = [];
  let currentFrame = 0;

  Matter.Events.on(engine, "collisionStart", (event) => {
    for (const pair of event.pairs) {
      const idA = pair.bodyA.id;
      const idB = pair.bodyB.id;
      if (ballIds.has(idA) && ballIds.has(idB)) {
        const timeMs = (currentFrame / fps) * 1000;
        collisionTimes.push(timeMs);
      }
    }
  });

  const bgGray = Math.floor(Math.random() * 256);
  const bgColor = `rgb(${bgGray}, ${bgGray}, ${bgGray})`;

  const frameBuffers = [];
  for (let frame = 0; frame < totalFrames; frame++) {
    Matter.Engine.update(engine, 1000 / fps);

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    balls.forEach((body) => {
      ctx.beginPath();
      ctx.arc(
        body.position.x,
        body.position.y,
        body.circleRadius,
        0,
        2 * Math.PI
      );
      ctx.fillStyle = body.render.color;
      ctx.fill();
    });
    const buf = canvas.toBuffer("image/png");
    frameBuffers.push(buf);
    currentFrame++;
  }

  const args = [
    "-f",
    "image2pipe",
    "-vcodec",
    "png",
    "-r",
    `${fps}`,
    "-i",
    "pipe:0",
  ];

  collisionTimes.forEach((t, i) => {
    const freq = 200 + Math.random() * 800;
    args.push(
      "-f",
      "lavfi",
      "-i",
      `sine=frequency=${freq}:duration=0.05:sample_rate=44100,volume=3`
    );
  });

  let filterComplex = "";
  collisionTimes.forEach((t, i) => {
    filterComplex += `[${i + 1}:a]adelay=${t}[s${i}];`;
  });

  const mixInputs = collisionTimes.map((_, i) => `[s${i}]`).join("");
  filterComplex += `${mixInputs}amix=inputs=${collisionTimes.length}[aout]`;

  args.push(
    "-filter_complex",
    filterComplex,
    "-map",
    "0:v",
    "-map",
    "[aout]",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-t",
    `${duration}`,
    outputPath
  );

  const ffmpeg = spawn(ffmpegPath, args, {
    stdio: ["pipe", "ignore", "pipe"],
  });

  ffmpeg.on("error", (err) => {
    console.error("FFmpeg error:", err);
  });

  for (const buf of frameBuffers) {
    ffmpeg.stdin.write(buf);
  }
  ffmpeg.stdin.end();

  ffmpeg.stderr.on("data", (data) => {
    console.error("FFmpeg error:", data.toString());
  });

  ffmpeg.on("close", async (code) => {
    if (code !== 0) {
      console.error("FFmpeg exited with code", code);
      return interaction.editReply("❌ Failed to generate simulation.");
    }

    const attachment = new AttachmentBuilder(outputPath, {
      name: "simulation.mp4",
    });
    await interaction.editReply({ files: [attachment] });
    fs.unlinkSync(outputPath);
  });
}

module.exports = { data, run };
