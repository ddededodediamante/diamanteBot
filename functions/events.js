const {
  Client,
  Events,
  GuildMember,
  CommandInteraction,
} = require("discord.js");
const { get } = require("./db");

delete require.cache[require.resolve("./imageEffects")];
const imageEffects = require("./imageEffects");

delete require.cache[require.resolve("./gifEffects")];
const gifEffects = require("./gifEffects");

module.exports = async (client = Client.prototype) => {
  const ddeCord = await client.guilds.fetch("1011004713908576367");

  const settings = {
    ddeCord,
    memberRole: await ddeCord.roles.fetch("1069722932558962700", {
      cache: true,
    })
  };

  client.removeAllListeners();

  client.on(
    Events.InteractionCreate,
    async (interaction = CommandInteraction.prototype) => {
      if (interaction.isAutocomplete()) {
        const focused = interaction.options.getFocused();
        let choices = [];

        if (interaction.commandName === "image") {
          let initialChoices = Object.keys(imageEffects).map((key) => ({
            name: key.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase(),
            value: key,
          }));

          choices = initialChoices.filter((choice) =>
            choice.name.includes(focused.toLowerCase())
          );
        } else if (interaction.commandName === "gif") {
          let initialChoices = Object.keys(gifEffects).map((key) => ({
            name: key.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase(),
            value: key,
          }));

          choices = initialChoices.filter((choice) =>
            choice.name.includes(focused.toLowerCase())
          );
        }

        return await interaction.respond(
          choices.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 25)
        );
      }

      if (
        !interaction.isChatInputCommand() &&
        !interaction.isContextMenuCommand()
      )
        return;

      const command = client.commands.get(interaction.commandName);
      if (!command || !command.run || !command.data)
        return interaction.reply({
          content: "❌ Unknown command",
          flags: "Ephemeral",
        });

      try {
        return await command.run(interaction);
      } catch (error) {
        console.error(error);

        if (interaction.replied || interaction.deferred) {
          return await interaction.followUp(
            "❌ There was an error while running this command"
          );
        } else {
          return await interaction.reply(
            "❌ There was an error while running this command"
          );
        }
      }
    }
  );

  client.on(Events.GuildMemberAdd, async (member = GuildMember.prototype) => {
    if (member.user.bot) return;

    if (member.guild.id === settings.ddeCord.id) {
      try {
        await member.roles.add(settings.memberRole);
      } catch (error) {
        console.error("Failed to assign member role for ddeCord:", error);
      }
    }

    const configKey = `welcome.${member.guild.id}`;
    const config = get(configKey);
    if (!config) return;

    try {
      const channelId = config.channel;
      const messages = config.messages;
      if (!channelId || !messages?.length) return;

      const channel = await member.guild.channels.fetch(channelId, {
        cache: true,
      });
      if (!channel || !channel.isTextBased()) return;

      const message = messages[
        Math.floor(Math.random() * messages.length)
      ].replace("{user}", member.toString());

      await channel.send({
        content: `<:join:1367235272533868687> ${message}`.slice(0, 2000),
        allowedMentions: { users: [member.id] },
      });
    } catch (error) {
      console.error("Failed to send welcome message:", error);
    }

    try {
      const roleId = config.role;
      if (!roleId) return;

      const role = await member.guild.roles.fetch(roleId, {
        cache: true,
      });
      if (!role) return;

      await member.roles.add(role);
    } catch (error) {
      console.error("Failed to add role:", error);
    }
  });

  client.on(
    Events.GuildMemberRemove,
    async (member = GuildMember.prototype) => {
      if (member.user.bot) return;

      const configKey = `farewell.${member.guild.id}`;
      const config = get(configKey);
      if (!config) return;

      try {
        const channelId = config.channel;
        const messages = config.messages;

        if (!channelId || !messages?.length) return;

        const channel = await member.guild.channels.fetch(channelId, {
          cache: true,
        });
        if (!channel || !channel.isTextBased()) return;

        const message = messages[
          Math.floor(Math.random() * messages.length)
        ].replace("{user}", member.toString());

        await channel.send({
          content: `<:leave:1367235263104815145> ${message}`.slice(0, 2000),
          allowedMentions: { users: [member.id] },
        });
      } catch (error) {
        console.error("Failed to send farewell message:", error);
      }
    }
  );

  client.on(Events.Error, (err) => {
    console.error(err);
  });
};
