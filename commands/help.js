const {
  SlashCommandBuilder,
  ApplicationIntegrationType,
  InteractionContextType,
  ChatInputCommandInteraction,
  EmbedBuilder,
} = require("discord.js");

const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription(
    "Bot | Shows a list of all commands or details of a specific command"
  )
  .addStringOption((option) =>
    option
      .setName("command")
      .setDescription("The specific command you want help with")
      .setRequired(false)
  )
  .setContexts(
    InteractionContextType.BotDM,
    InteractionContextType.Guild,
    InteractionContextType.PrivateChannel
  )
  .setIntegrationTypes(
    ApplicationIntegrationType.GuildInstall,
    ApplicationIntegrationType.UserInstall
  );

const optionTypeValues = {
  1: "Subcommand",
  2: "Subcommand Group",
  3: "String",
  4: "Integer",
  5: "Boolean",
  6: "User",
  7: "Channel",
  8: "Role",
  9: "Mentionable",
  10: "Number",
  11: "Attachment",
};

const run = async (interaction = ChatInputCommandInteraction.prototype) => {
  const { client } = interaction;
  const commandName = interaction.options.getString("command");

  const commands = Array.from(client.commands.values()).map((command) =>
    command.data.toJSON()
  );

  if (commandName) {
    const command = commands.find(i => i.name === commandName);
    if (!command) {
      return interaction.reply({
        content: `❌ No command found with the name \`${commandName}\`.`,
        flags: "Ephemeral",
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(`📖 Help: /${command.name}`)
      .setDescription(command.description ?? "No description available.");
    if (command.options && command.options.length > 0)
      embed.setFields({
        name: "Options",
        value: command.options
          .map(
            (i) =>
              `→ **${i.name}** (${
                optionTypeValues[Number(i.type)] ?? "Unknown"
              }) - ${i?.description ?? "No description available."}`
          )
          .join("\n"),
      });

    return await interaction.reply({ embeds: [embed], flags: "Ephemeral" });
  }

  const embed = new EmbedBuilder()
    .setTitle("📚 Available Commands")
    .setDescription(
      commands
        .map(
          (i) =>
            `**/${i.name}** - ${
              i?.description ?? "No description available."
            }`
        )
        .join("\n")
    );

  return await interaction.reply({ embeds: [embed], flags: "Ephemeral" });
};

module.exports = { data, run };
