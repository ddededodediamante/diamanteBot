const {
  Client,
  Events,
  GuildMember,
  CommandInteraction,
} = require("discord.js");
const Servers = require("../models/serverSchema.js");

delete require.cache[require.resolve("./imageEffects")];
const imageEffects = require("./imageEffects");

delete require.cache[require.resolve("./gifEffects")];
const gifEffects = require("./gifEffects");

module.exports = async (client = Client.prototype) => {
  client.removeAllListeners();

  client.on(Events.GuildCreate, async (guild) => {
    try {
      let existing = await Servers.findOne({ id: guild.id });
      if (!existing) {
        await Servers.create({
          id: guild.id,
          welcome: { channel: null, messages: [], role: null },
          farewell: { channel: null, messages: [] },
          counting: {
            channel: null,
            count: 0,
            lastUser: null,
            mistakeThreadId: null,
            resetOnWrong: false,
          },
        });
        console.log(
          `✅ Created config for new guild: ${guild.name} (${guild.id})`
        );
      } else {
        console.log(
          `ℹ️ Guild already exists in DB: ${guild.name} (${guild.id})`
        );
      }
    } catch (err) {
      console.error(`❌ Failed to create config for guild ${guild.id}:`, err);
    }
  });

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
        const method =
          interaction.deferred || interaction.replied ? "followUp" : "reply";
        return interaction[method]({
          content: "❌ There was an error while running this command",
          flags: "Ephemeral",
        });
      }
    }
  );

  client.on(Events.GuildMemberAdd, async (member = GuildMember.prototype) => {
    if (member.user.bot) return;

    const config = await Servers.findOne({ id: member.guild.id });
    if (!config?.welcome) return;

    try {
      const { channel: channelId, messages, role: roleId } = config.welcome;
      if (channelId && messages?.length > 0) {
        const channel = await member.guild.channels.fetch(channelId, {
          cache: true,
        });

        if (channel?.isTextBased()) {
          const message = messages[
            Math.floor(Math.random() * messages.length)
          ].replace("{user}", member.toString());

          await channel.send({
            content: `<:join:1367235272533868687> ${message}`.slice(0, 2000),
            allowedMentions: { users: [member.id] },
          });
        }
      }

      if (roleId) {
        const role = await member.guild.roles.fetch(roleId, { cache: true });
        if (role) {
          await member.roles.add(role);
        }
      }
    } catch (error) {
      console.error("Failed to send welcome message or add role:", error);
    }
  });

  client.on(
    Events.GuildMemberRemove,
    async (member = GuildMember.prototype) => {
      if (member.user.bot) return;

      const config = await Servers.findOne({ id: member.guild.id });
      if (!config?.farewell) return;

      try {
        const { channel: channelId, messages } = config.farewell;
        if (!channelId || !messages?.length) return;

        const channel = await member.guild.channels.fetch(channelId, {
          cache: true,
        });
        if (!channel?.isTextBased()) return;

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

  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.guildId) return;

    const config = await Servers.findOne({ id: message.guildId });
    if (!config?.counting) return;

    const { channel: channelId, resetOnWrong = false } = config.counting;
    let { count = 0, lastUser, mistakeThreadId } = config.counting;

    if (message.channelId !== channelId) return;

    const got = parseInt(message.content.trim(), 10);
    if (isNaN(got)) return;

    if (message.author.id === lastUser) {
      if (message.deletable) return message.delete();
      return message.react("❌");
    }

    const expected = count + 1;

    if (got === expected) {
      await Servers.updateOne(
        { id: message.guildId },
        {
          $set: {
            "counting.count": expected,
            "counting.lastUser": message.author.id,
          },
        }
      );
      return await message.react("✅").catch(() => {});
    }

    if (resetOnWrong) {
      await Servers.updateOne(
        { id: message.guildId },
        { $set: { "counting.count": 0, "counting.lastUser": null } }
      );
      if (message.deletable) message.delete();
      return message.reply(
        `❌ Wrong number! Count has been reset. The next number is **1**.`
      );
    }

    let thread;
    try {
      if (mistakeThreadId) {
        thread = await client.channels.fetch(mistakeThreadId);
        if (thread?.isThread() && thread.archived) {
          await thread.setArchived(false, "Reopening mistakes thread");
        }
      }
    } catch (err) {
      console.error("Error fetching mistakes thread:", err);
      thread = null;
    }

    if (!thread?.isThread()) {
      try {
        thread = await message.channel.threads.create({
          name: "Counting Mistakes",
          autoArchiveDuration: 60,
          reason: "Initializing mistakes thread",
        });
        mistakeThreadId = thread.id;
        await Servers.updateOne(
          { id: message.guildId },
          { $set: { "counting.mistakeThreadId": mistakeThreadId } }
        );
      } catch (err) {
        console.error("Could not create mistakes thread:", err);
        thread = null;
      }
    }

    const notice = `❌ <@${message.author.id}> posted **${got}**, but the next number should be **${expected}**.`;
    let sentInThread = false;
    if (thread?.isThread()) {
      try {
        await thread.send(notice);
        sentInThread = true;
      } catch (err) {
        console.error("Failed to send counting mistake in thread:", err);
      }
    }

    if (!sentInThread) {
      try {
        await message.author.send(
          `❌ In <#${message.channelId}>, you sent **${got}**, but the next number should be **${expected}**.`
        );
      } catch (err) {
        console.warn(
          `Failed to DM user ${message.author.tag} for counting mistake`
        );
      }
    }

    if (message.deletable) {
      await message.delete();
    } else {
      await message.react("❌").catch(() => {});
    }
  });

  client.on(Events.Error, (err) => {
    console.error(err);
  });
};
