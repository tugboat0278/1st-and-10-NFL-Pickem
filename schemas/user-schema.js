const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  id: {
    type: String,
    required: true,
    unique: true
  },

  picks: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  scores: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

module.exports = mongoose.model('users', userSchema);
