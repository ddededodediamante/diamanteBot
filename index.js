console.log("✅ index.js started");
const isTest = process.argv.includes("--test");
require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
  Events,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const client = new Client({
  intents: Object.values(GatewayIntentBits),
});

client.imageCache = new Map();
client.commands = new Collection();

function reload(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

function loadCommands() {
  client.commands = new Collection();
  const commandsPath = path.join(__dirname, "commands");
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((f) => f.endsWith(".js"));

  for (const file of commandFiles) {
    const fullPath = path.join(commandsPath, file);
    try {
      const cmd = reload(fullPath);
      if (cmd.data?.name && typeof cmd.run === "function") {
        client.commands.set(cmd.data.name, cmd);
      } else {
        console.warn(`Skipping ${file}: missing data.name or run()`);
      }
    } catch (err) {
      console.error(`Error loading ${file}:`, err);
    }
  }
}
client.loadCommands = loadCommands;

async function registerSlashCommands() {
  try {
    const rest = new REST({ version: "10" }).setToken(
      isTest ? process.env.test_token : process.env.token
    );
    await rest.put(Routes.applicationCommands(client.user.id), {
      body: client.commands.map((c) => c.data.toJSON()),
    });
    console.log(`✅ Registered ${client.commands.size} commands`);
  } catch (err) {
    console.error("❌ Command registration failed:", err);
  }
}
client.registerSlashCommands = registerSlashCommands;

client.getEmoji = (emojiName) => {
  let appEmojis = client.application.emojis;
  return appEmojis.cache.some((emoji) => emoji.name === emojiName)
    ? appEmojis.cache.find((emoji) => emoji.name === emojiName)
    : "❓";
};

client.once(Events.ClientReady, async () => {
  console.log("✅ Client ready");

  try {
    const reloadEvents = reload("./functions/events.js");
    reloadEvents(client);
    console.log("✅ Events loaded");
  } catch (err) {
    console.error("❌ Failed to load events.js:", err);
  }

  await registerSlashCommands();
});

client
  .login(isTest ? process.env.test_token : process.env.token)
  .then(() => {
    loadCommands();
  })
  .catch(console.error);

const { connect } = require("mongoose");

connect(process.env.mongo_uri).then(() =>
  console.log("✅ Connected to the database")
);

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

const express = require("express");
const rateLimit = require("express-rate-limit");

const app = express();
const port = Number(process.env?.port ?? 3000);

const limiter = rateLimit({
  windowMs: 30 * 1000,
  max: 60,
  message: "Too many requests from this IP, please try again later.",
});

app.set("trust proxy", 1);

app.use(express.json());
app.use(limiter);
app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/", (_req, res) => {
  res.send("RandoBot API");
});

app.get("/bot", (_req, res) => {
  const guilds = client.guilds.cache.size;
  const channels = client.channels.cache.size;
  const users = client.users.cache.size;

  res.json({
    guilds,
    channels,
    users,
    uptime: client.uptime,
    ping: client.ws.ping,
  });
});

app.get("/commands", (_req, res) => {
  const commands = Array.from(client.commands.values()).map((command) => {
    const { name, description, type, options } = command.data.toJSON();

    return {
      name,
      description,
      type,
      options,
    };
  });

  res.json(commands);
});

app.listen(port, () => {
  console.log(`✅ Listening on port ${port}`);
});
