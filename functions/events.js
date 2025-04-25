const {
  Client,
  Events,
  GuildMember,
  CommandInteraction,
} = require("discord.js");

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
    }),
    welcomeChannel: await ddeCord.channels.fetch("1112121025249955910", {
      cache: true,
    }),
    welcomeMessages: [
      "{user} just joined, say hi!",
      "A wild {user} appeared.",
      "Everyone, welcome {user}!",
      "{user} is here.",
      "{user} has just landed.",
      "Woah! {user} is here!",
    ],
    leavingMessages: [
      "{user} has just left...",
      "{user} vanished.",
      "Oh no, {user} left us!",
      "That's one less {user}...",
      "Did {user} just leave? Aw man.",
    ],
  };

  client.removeAllListeners();

  client.on(Events.InteractionCreate, async (interaction = CommandInteraction.prototype) => {
      if (interaction.isAutocomplete()) {
        const focused = interaction.options.getFocused();
        let choices = [];

        if (interaction.commandName === "image") {
          let initialChoices = Object.keys(imageEffects).map((key) => ({
            name: key.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase(),
            value: key,
          }));

          let filtered = initialChoices.filter((choice) =>
            choice.name.includes(focused.toLowerCase())
          );

          choices = filtered.slice(0, 25);
        } else if (interaction.commandName === "gif") {
          let initialChoices = Object.keys(gifEffects).map((key) => ({
            name: key.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase(),
            value: key,
          }));

          let filtered = initialChoices.filter((choice) =>
            choice.name.includes(focused.toLowerCase())
          );

          choices = filtered.slice(0, 25);
        }

        return await interaction.respond(choices.slice(0, 25));
      }
      
      if (
        !interaction.isChatInputCommand() &&
        !interaction.isContextMenuCommand()
      ) return;

      const command = client.commands.get(interaction.commandName);
      if (!command || !command.run || !command.data)
        return interaction.reply({
          content: "❌ Unknown command",
          flags: 'Ephemeral',
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
    if (member.user.bot || member.guild.id !== settings.ddeCord.id) return;

    try {
      await member.roles.add(settings.memberRole);
    } catch (error) {
      console.error("Failed to assign member role:", error);
    }

    try {
      const array = settings.welcomeMessages;
      const randomMessage = array[Math.floor(Math.random() * array.length)];

      await settings.welcomeChannel.send({
        content: `<:join:1362862914112978965> ${randomMessage.replace(
          "{user}",
          member.toString()
        )}`,
        allowedMentions: { parse: [] },
      });
    } catch (error) {
      console.error("Failed to send welcome message:", error);
    }
  });

  client.on(Events.GuildMemberRemove, async (member = GuildMember.prototype) => {
      if (member.user.bot || member.guild.id !== settings.ddeCord.id) return;

      try {
        const array = settings.leavingMessages;
        const randomMessage = array[Math.floor(Math.random() * array.length)];

        await settings.welcomeChannel.send({
          content: `<:leave:1362863189104136343> ${randomMessage.replace(
            "{user}",
            member.toString()
          )}`,
          allowedMentions: { parse: [] },
        });
      } catch (error) {
        console.error("Failed to send leave message:", error);
      }
    }
  );

  client.on(Events.Error, (err) => {
    console.error(err);
  });
};
