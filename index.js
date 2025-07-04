console.log("✅ index.js started");

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
    const rest = new REST({ version: "10" }).setToken(process.env.token);
    await rest.put(Routes.applicationCommands(process.env.client_id), {
      body: client.commands.map((c) => c.data.toJSON()),
    });
    console.log("✅ Commands registered");
  } catch (err) {
    console.error("❌ Command registration failed:", err);
  }
}
client.registerSlashCommands = registerSlashCommands;

const { getTodayEvent } = require("./functions/specialDay");
const { set, get } = require("./functions/db");

async function updateServerIcon(client) {
  const guild = await client.guilds.fetch("1011004713908576367");
  const event = getTodayEvent() || {
    file: "default.png",
    name: "Nothing",
  };

  if (!event || get("ddecord-event") === event.name) return;
  set("ddecord-event", event.name);

  const filePath = path.join(
    __dirname,
    "images/specialServerIcons",
    event.file
  );
  if (!fs.existsSync(filePath)) {
    console.warn("⚠️ Missing file:", event);
    return;
  }

  try {
    await guild.setIcon(fs.readFileSync(filePath));
    console.log(`🔄 Server icon set to ${event.file}`);

    if (event.file !== "default.png") {
      const eventChannel = await guild.channels.fetch("1112121025249955910");
      if (eventChannel && eventChannel.isTextBased()) {
        await eventChannel.send(
          `:star: **New event!** it's... ${event.name}! :star:`
        );
      }
    }
  } catch (err) {
    console.error("❌ Failed to update icon or send message:", err);
  }
}

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

  updateServerIcon(client);
  setInterval(() => updateServerIcon(client), 60 * 60 * 1000);
});

client
  .login(process.env.token)
  .then(() => {
    loadCommands();
  })
  .catch(console.error);

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
