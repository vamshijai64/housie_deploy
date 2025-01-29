const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gameNumbersSchema = new Schema({
  gameId: {
      type: String,
      ref: 'games',
      required: true
  },
  numbersSend: [
    {
      sendNumber: Number,
      timestamps: String,
    },
  ],
  status: {
      type: String,
      enum: ['started', 'completed'],
      default: 'started'
  },
  claimStatus: {
    type: Boolean,
    default: false
  }
},
{
  timestamps: true
});

module.exports = mongoose.model('gameNumbers', gameNumbersSchema);