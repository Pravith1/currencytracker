const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  members: { type: [String], required: true }, // array of rollNo strings
  score: { type: Number, default: 0 },
});

module.exports = mongoose.model('Team', teamSchema);
