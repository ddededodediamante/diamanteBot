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
      "Look who's here! It's {user}!",
      "Guess who just showed up? {user}!",
      "{user} slid into the chat.",
      "Brace yourselves, {user} has arrived.",
      "Say hello to our newest guest: {user}!",
      "{user} just popped in.",
    ],
    leavingMessages: [
      "{user} has just left.",
      "{user} vanished.",
      "Oh no, {user} left us!",
      "Did {user} just leave? Aw man.",
      "{user} ragequit.",
      "Goodbye {user}, until next time.",
      "Poof. {user} disappeared.",
      "{user} dipped out.",
      "{user} just peaced out.",
      "{user} left the building.",
      "And just like that, {user} is gone.",
      "We'll miss you, {user}.",
      "{user} logged off.",
      "Later, {user}!",
    ],
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
        content: `<:join:1367235272533868687> ${randomMessage.replace(
          "{user}",
          member.toString()
        )}`,
        allowedMentions: { parse: [] },
      });
    } catch (error) {
      console.error("Failed to send welcome message:", error);
    }
  });

  client.on(
    Events.GuildMemberRemove,
    async (member = GuildMember.prototype) => {
      if (member.user.bot || member.guild.id !== settings.ddeCord.id) return;

      try {
        const array = settings.leavingMessages;
        const randomMessage = array[Math.floor(Math.random() * array.length)];

        await settings.welcomeChannel.send({
          content: `<:leave:1367235263104815145> ${randomMessage.replace(
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
