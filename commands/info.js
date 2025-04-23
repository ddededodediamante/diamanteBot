const {
  SlashCommandBuilder,
  InteractionContextType,
  ApplicationIntegrationType,
  CommandInteraction,
  EmbedBuilder
} = require("discord.js");

const data = new SlashCommandBuilder()
  .setName("info")
  .setDescription("Util | Shows info about a server, channel, user, or emoji")
  .setContexts(
    InteractionContextType.BotDM,
    InteractionContextType.Guild,
    InteractionContextType.PrivateChannel
  )
  .setIntegrationTypes(
    ApplicationIntegrationType.GuildInstall,
    ApplicationIntegrationType.UserInstall
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("server")
      .setDescription("Get info for the current server")
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("channel")
      .setDescription("Get info for a channel")
      .addChannelOption((option) =>
        option
          .setName("target")
          .setDescription("The channel to get info for")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("user")
      .setDescription("Get info for a user")
      .addUserOption((option) =>
        option
          .setName("target")
          .setDescription("The user to get info for")
          .setRequired(false)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("emoji")
      .setDescription("Get info for an emoji")
      .addStringOption((option) =>
        option
          .setName("target")
          .setDescription("The emoji to get info for (custom or unicode)")
          .setRequired(true)
      )
  );

const run = async (interaction = CommandInteraction.prototype) => {
  const guild = interaction.guild;
  const subcommand = interaction.options.getSubcommand();
  let embed = new EmbedBuilder();

  switch (subcommand) {
    case "server": {
      if (!guild)
        return interaction.reply({
          content: "❌ This command can only be used in a server I am on!",
          flags: "Ephemeral",
        });

      embed
        .setTitle(`Server | ${guild.name}`)
        .setThumbnail(guild.iconURL())
        .addFields({
          name: "Total Members",
          value: `${guild.memberCount}`,
          inline: true,
        })
        .setFooter({ text: String(guild.id) });
      break;
    }
    case "channel": {
      if (!guild)
        return interaction.reply({
          content: "❌ This command can only be used in a server I am on!",
          flags: "Ephemeral",
        });

      const channel = interaction.options.getChannel("target");

      embed
        .setTitle(`Channel | ${channel.name}`)
        .addFields({
          name: "Type",
          value: channel.type.toString(),
          inline: true,
        })
        .setFooter({ text: String(channel.id) });
      break;
    }
    case "user": {
      const user = interaction.options.getUser("target") ?? interaction.user;
      const fetched = await user.fetch();
      const timestamp = Math.floor((user.createdTimestamp ?? 0) / 1000);

      embed
        .setTitle(`${user.bot ? "Bot" : "User"} | ${user.tag}`)
        .setDescription(`
          System User? ${user.system ? "✅" : "❌"}
          Partial? ${user.partial ? "✅" : "❌"}
        `.trim())
        .setFields(
          {
            name: "Creation Date",
            value: `<t:${timestamp}:R> | <t:${timestamp}:f>`
          },
          {
            name: "Accent Color",
            value: fetched.hexAccentColor ?? "Unknown"
          }
        )
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setColor(fetched.hexAccentColor ?? "Random")
        .setFooter({ text: String(user.id) });
      break;
    }
    case "emoji": {
      const emojiInput = interaction.options.getString("target");
      const customEmojiRegex = /<a?:\w+:(\d+)>/;
      const match = emojiInput.trim().match(customEmojiRegex);
      let emojiId = match ? match[1] : null;

      if (emojiId) {
        const emoji =
          interaction.guild?.emojis?.cache?.get(emojiId) ??
          interaction.client?.emojis?.cache?.get(emojiId);

        if (emoji) {
          embed
            .setTitle("Emoji | " + emoji.name)
            .setDescription(`Animated? ${emoji.animated ? "✅" : "❌"}`)
            .setThumbnail(emoji.imageURL())
            .setURL(emoji.imageURL())
            .setFooter({ text: String(emoji.id) });
        } else {
          return interaction.reply({
            content: "❌ Emoji was not found",
            flags: "Ephemeral",
          });
        }
      } else {
        let svgUrl, pngUrl;

        try {
          let codepoint = String(emojiInput).codePointAt(0).toString(16);

          svgUrl = `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/${codepoint}.svg`;
          pngUrl = `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/${codepoint}.png`;
        } catch (error) {
          console.error(error);
        }

        embed
          .setTitle("Emoji | " + emojiInput)
          .setDescription("`" + emojiInput + "`")
          .setFields({
            name: "URLs",
            value:
              typeof svgUrl === "string" && typeof svgUrl === "string"
                ? `[PNG](${pngUrl}) | [SVG](${svgUrl})`
                : "Unavailable",
            inline: true,
          })
          .setThumbnail(pngUrl);
      }
      break;
    }
  }

  await interaction.reply({ embeds: [embed] });
};

module.exports = { data, run };
