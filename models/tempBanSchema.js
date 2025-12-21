const mongoose = require("mongoose");

const TempBanSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  reason: { type: String, default: "No reason provided" },
  expiresAt: { type: Date, required: true },
  moderatorId: { type: String, required: true },
});

TempBanSchema.index({ expiresAt: 1 });

module.exports = mongoose.model("TempBans", TempBanSchema);
