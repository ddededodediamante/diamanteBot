const TempBan = require("../models/tempBan");

module.exports = async (client) => {
  const check = async () => {
    const now = new Date();

    const expired = await TempBan.find({ expiresAt: { $lte: now } });

    for (const ban of expired) {
      const guild = client.guilds.cache.get(ban.guildId);
      if (!guild) {
        await TempBan.deleteOne({ _id: ban._id });
        continue;
      }

      await guild.bans.remove(ban.userId).catch(() => { });

      await TempBan.deleteOne({ _id: ban._id });
    }
  };

  await check();

  setInterval(check, 60000);
};
