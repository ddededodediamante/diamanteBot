require("dotenv").config();

const { Client, GatewayIntentBits, Routes, Collection, Events } = require("discord.js");
const { REST } = require("@discordjs/rest");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const client = new Client({ intents: Object.values(GatewayIntentBits) });

function reaquire(moduleName) {
  delete require.cache[require.resolve(moduleName)];
  return require(moduleName);
}

function loadCommands() {
  client.commands = new Collection();
  const commandsPath = path.join(__dirname, "commands");
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
      const command = reaquire(filePath);
      if ("data" in command && "run" in command) {
        client.commands.set(command.data.name, command);
      } else {
        console.warn(`Command at ${filePath} is missing required properties.`);
      }
    } catch (error) {
      console.error(`Error loading command ${file}:`, error);
    }
  }
}

client.loadCommands = loadCommands;
loadCommands();

const rest = new REST({ version: "10" }).setToken(process.env.token);
(async () => {
  try {
    await rest.put(Routes.applicationCommands(process.env.client_id), {
      body: client.commands.map((cmd) => cmd.data.toJSON()),
    });
    console.log("✅ Slash commands registered");
  } catch (err) {
    console.error("❌ Failed to register commands:", err);
  }
})();

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command || !command.run || !command.data)
    return interaction.reply({
      content: "❌ Unknown command",
      ephemeral: true,
    });

  try {
    await command.run(interaction);
  } catch (error) {
    console.error(error);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "❌ There was an error while running this command",
        flags: "Ephemeral",
      });
    } else {
      await interaction.reply({
        content: "❌ There was an error while running this command",
        flags: "Ephemeral",
      });
    }
  }
});

client.on(Events.GuildMemberAdd, async (member) => {
  const targetGuildId = "1011004713908576367";
  const roleId = "1069722932558962700";

  if (member.guild.id !== targetGuildId) return;

  try {
    const role = member.guild.roles.cache.get(roleId);
    if (!role) return console.error("Role not found!");

    await member.roles.add(role);
  } catch (error) {
    console.error("Failed to assign member role:", error);
  }
});

client.on(Events.Error, (e) => {
  console.error(e);
});

client.once(Events.ClientReady, () => {
  console.log("✅ The bot is online");
});

client.login(process.env.token);
