const {
  SlashCommandBuilder,
  InteractionContextType,
  ApplicationIntegrationType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ChannelType,
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
      .setDescription("Util | Get info for the current server")
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("channel")
      .setDescription("Util | Get info for a channel")
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
      .setDescription("Util | Get info for a user")
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
      .setDescription("Util | Get info for an emoji")
      .addStringOption((option) =>
        option
          .setName("target")
          .setDescription("The emoji to get info for (custom or unicode)")
          .setRequired(true)
      )
  );

const run = async (interaction = ChatInputCommandInteraction.prototype) => {
  const guild = interaction.guild;
  const subcommand = interaction.options.getSubcommand();
  let embed = new EmbedBuilder();

  switch (subcommand) {
    case "server": {
      if (!guild)
        return interaction.reply({
          content: "❌ You must use this command in a server",
          flags: "Ephemeral",
        });

      const owner = await guild.fetchOwner();
      const created = Math.floor(guild.createdTimestamp / 1000);

      embed
        .setTitle(`Server | ${guild.name}`)
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .addFields(
          { name: "Owner", value: `${owner.user.tag}`, inline: true },
          { name: "Created", value: `<t:${created}:f>`, inline: true },
          { name: "Members", value: `${guild.memberCount}`, inline: true },
          {
            name: "Boosts",
            value: `${guild.premiumSubscriptionCount || 0}`,
            inline: true,
          },
          {
            name: "Boost Tier",
            value: `Tier ${guild.premiumTier}`,
            inline: true,
          },
          { name: "Roles", value: `${guild.roles.cache.size}`, inline: true },
          { name: "Emojis", value: `${guild.emojis.cache.size}`, inline: true }
        )
        .setFooter({ text: `ID: ${guild.id}` });
      break;
    }
    case "channel": {
      if (!guild)
        return interaction.reply({
          content: "❌ You must use this command in a server",
          flags: "Ephemeral",
        });

      const channel = interaction.options.getChannel("target");
      const created = Math.floor(channel.createdTimestamp / 1000);

      const fields = [
        { name: "Type", value: ChannelType[channel.type], inline: true },
        { name: "Created", value: `<t:${created}:f>`, inline: true },
      ];

      if (channel.type === ChannelType.GuildText) {
        fields.push(
          { name: "Topic", value: channel.topic || "None", inline: true },
          { name: "NSFW", value: channel.nsfw ? "Yes" : "No", inline: true },
          {
            name: "Slowmode",
            value: `${channel.rateLimitPerUser}s`,
            inline: true,
          }
        );
      }

      embed
        .setTitle(`Channel | ${channel.name}`)
        .addFields(fields)
        .setFooter({ text: `ID: ${channel.id}` });
      break;
    }
    case "user": {
      const user = interaction.options.getUser("target") || interaction.user;
      const member = guild ? guild.members.cache.get(user.id) : null;
      
      const created = Math.floor(user.createdTimestamp / 1000);
      const joined = member ? Math.floor(member.joinedTimestamp / 1000) : null;

      embed
        .setTitle(`${user.bot ? "Bot" : "User"} | ${user.tag}`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .addFields({
          name: "Created",
          value: `<t:${created}:f>`,
          inline: true,
        });

      if (joined) {
        embed.addFields({
          name: "Joined",
          value: `<t:${joined}:f>`,
          inline: true,
        });
      }

      if (member) {
        if (member.nickname) {
          embed.addFields({
            name: "Nickname",
            value: `${member.nickname}`,
            inline: true,
          });
        }

        embed.addFields({
          name: "Roles",
          inline: false,
          value:
            `Amount: ${member.roles.cache.size}\n` +
            `> Highest: ${member.roles.highest.toString()}`,
        });
      }

      embed.setFooter({ text: `ID: ${user.id}` });
      break;
    }
    case "emoji": {
      const input = interaction.options.getString("target");
      const custom = /<a?:\w+:(\d+)>/.exec(input);
      let emoji;
      if (custom) {
        emoji =
          guild?.emojis.cache.get(custom[1]) ||
          interaction.client.emojis.cache.get(custom[1]);
      }

      if (emoji) {
        const created = Math.floor(emoji.createdTimestamp / 1000);
        embed
          .setTitle(`Emoji | ${emoji.name}`)
          .setThumbnail(emoji.url)
          .addFields(
            {
              name: "Animated",
              value: emoji.animated ? "Yes" : "No",
              inline: true,
            },
            { name: "Created", value: `<t:${created}:f>`, inline: true }
          )
          .setFooter({ text: `ID: ${emoji.id}` });
      } else {
        const code = String(input).codePointAt(0).toString(16);
        const png = `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/${code}.png`;
        const svg = `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/${code}.svg`;

        embed
          .setTitle(`Emoji | ${input}`)
          .setThumbnail(png)
          .addFields(
            { name: "Unicode", value: `\`${input}\``, inline: true },
            { name: "PNG URL", value: `[View](${png})`, inline: true },
            { name: "SVG URL", value: `[View](${svg})`, inline: true }
          )
          .setFooter({ text: `Unicode: U+${code.toUpperCase()}` });
      }
      break;
    }
  }

  await interaction.reply({ embeds: [embed] });
};

module.exports = { data, run };
