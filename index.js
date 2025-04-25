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

client.on(Events.ClientReady, () => {
  console.log("✅ Client ready");

  try {
    const reloadEvents = reload("./functions/events.js");
    reloadEvents(client);
    console.log("✅ Events loaded");
  } catch (err) {
    console.error("❌ Failed to load events.js:", err);
  }

  const rest = new REST({ version: "10" }).setToken(process.env.token);
  (async () => {
    try {
      await rest.put(Routes.applicationCommands(process.env.client_id), {
        body: client.commands.map((c) => c.data.toJSON()),
      });
      console.log("✅ Commands registered");
    } catch (err) {
      console.error("❌ Command registration failed:", err);
    }
  })();
});

client
  .login(process.env.token)
  .then(() => {
    loadCommands();
  })
  .catch(console.error);

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);