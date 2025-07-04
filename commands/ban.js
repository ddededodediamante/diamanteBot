const {
  SlashCommandBuilder,
  ApplicationIntegrationType,
  InteractionContextType,
  EmbedBuilder,
  ChatInputCommandInteraction,
  PermissionsBitField,
} = require("discord.js");

const data = new SlashCommandBuilder()
  .setName("ban")
  .setDescription("Moderation | Bans a member permanently or temporarily")
  .setContexts(InteractionContextType.Guild)
  .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
  .addUserOption((opt) =>
    opt.setName("target").setDescription("The member to ban").setRequired(true)
  )
  .addStringOption((opt) =>
    opt.setName("reason").setDescription("The reason of the ban")
  );

const run = async (interaction = ChatInputCommandInteraction.prototype) => {
  const targetUser = interaction.options.getUser("target", true);
  const reason =
    interaction.options.getString("reason") || "No reason provided";

  if (
    !interaction.memberPermissions.has(PermissionsBitField.Flags.BanMembers)
  ) {
    return interaction.reply({
      content: "❌ You lack the `Ban Members` permission to do this",
      flags: "Ephemeral",
    });
  }

  if (interaction.user.id === targetUser.id) {
    return interaction.reply({
      content: "❌ You cannot ban yourself",
      flags: "Ephemeral",
    });
  }

  if (interaction.client.user.id === targetUser.id) {
    return interaction.reply({
      content: "❌ I cannot ban myself",
      flags: "Ephemeral",
    });
  }

  let targetMember = null;
  try {
    targetMember = await interaction.guild.members.fetch(targetUser.id);
  } catch {}

  if (targetMember) {
    if (
      targetMember.roles.highest.position >=
      interaction.member.roles.highest.position
    ) {
      return interaction.reply({
        content:
          "❌ You cannot ban a member with an equal or higher role than you",
        flags: "Ephemeral",
      });
    }

    if (!targetMember.bannable) {
      return interaction.reply({
        content:
          "❌ I cannot ban this user! Possible reasons:\n" +
          "- I don't have the **Ban Members** permission\n" +
          "- The user has an equal or higher role than mine\n" +
          "- They are the server owner",
        flags: "Ephemeral",
      });
    }
  } else {
    const already = await interaction.guild.bans.fetch(targetUser.id).catch(() => null);

    if (already) {
      return interaction.reply({
        content: "❌ The user selected is already banned.",
        flags: "Ephemeral",
      });
    }
  }

  await interaction.guild.members.ban(targetUser.id, {
    reason: `${reason} | ${interaction.user.tag}`,
  });

  const embed = new EmbedBuilder()
    .setColor("Green")
    .setTitle("✅ User banned")
    .addFields(
      {
        name: "Target",
        value: `${targetUser.tag} (${targetUser.id})`,
        inline: true,
      },
      { name: "Reason", value: reason, inline: true }
    );

  return await interaction.reply({ embeds: [embed], flags: "Ephemeral" });
};

module.exports = { data, run };
