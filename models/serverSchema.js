const mongoose = require("mongoose");

const ServerSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true, 
    unique: true,
  },
  welcome: {
    channel: { type: String, default: null }, 
    messages: { type: [String], default: ["Welcome {user}!"] }, 
    role: { type: String, default: null },
  },
  farewell: {
    channel: { type: String, default: null },
    messages: { type: [String], default: ["Goodbye {user}!"] },
  },
  counting: {
    channel: { type: String, default: null },
    count: { type: Number, default: 0 },
    lastUser: { type: String, default: null },
    mistakeThreadId: { type: String, default: null },
    resetOnWrong: { type: Boolean, default: false },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Servers", ServerSchema);
