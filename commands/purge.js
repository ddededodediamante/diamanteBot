const {
  SlashCommandBuilder,
  ApplicationIntegrationType,
  InteractionContextType,
  EmbedBuilder,
  ChatInputCommandInteraction,
  PermissionsBitField,
} = require("discord.js");

const data = new SlashCommandBuilder()
  .setName("purge")
  .setDescription("Moderation | Deletes multiple messages")
  .setContexts(InteractionContextType.Guild)
  .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
  .addIntegerOption((opt) =>
    opt
      .setName("count")
      .setDescription("Number of messages to delete (2–100)")
      .setRequired(true)
      .setMinValue(2)
      .setMaxValue(100)
  )
  .addStringOption((opt) =>
    opt.setName("reason").setDescription("Reason for purging messages")
  );

const run = async (interaction = ChatInputCommandInteraction.prototype) => {
  const count = interaction.options.getInteger("count", true);
  const reason =
    interaction.options.getString("reason") || "No reason provided";

  if (
    !interaction.memberPermissions.has(PermissionsBitField.Flags.ManageMessages)
  ) {
    return interaction.reply({
      content: "❌ You lack the **Manage Messages** permission",
      flags: "Ephemeral",
    });
  }

  const channel = interaction.channel;
  if (!channel || !channel.isTextBased()) {
    return interaction.reply({
      content: "❌ Purge can only be used in text channels",
      flags: "Ephemeral",
    });
  }

  const fetched = await channel.messages.fetch({ limit: count });
  await channel.bulkDelete(fetched, true).catch(() => {});

  const embed = new EmbedBuilder()
    .setColor("Green")
    .setTitle("✅ Messages purged")
    .addFields(
      { name: "Channel", value: `${channel}`, inline: true },
      { name: "Amount", value: `${fetched.size}`, inline: true },
      { name: "Reason", value: reason, inline: false }
    );

  return interaction.reply({ embeds: [embed], flags: "Ephemeral" });
};

module.exports = { data, run };
