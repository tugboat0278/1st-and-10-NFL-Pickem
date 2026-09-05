const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  week: {
    type: String,
    required: true,
    unique: true
  },

  games: {
    type: [String],
    default: []
  },

  winners: {
    type: String,
    default: ''
  }
});

module.exports = mongoose.model(
  'Schedule',
  scheduleSchema,
  'Schedule'
);
