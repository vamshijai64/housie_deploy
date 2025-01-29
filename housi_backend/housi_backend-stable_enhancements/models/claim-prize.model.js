const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const claimPrize = new Schema({
  gameId: {
    type: String,
    ref: 'games'
  },
  firstLineWinners: {
    type: Number,
    default: 0
  },
  secondLineWinners: {
    type: Number,
    default: 0
  },
  thirdLineWinners: {
    type: Number,
    default: 0
  },
  fullHousieWinners: {
    type: Number,
    default: 0
  },
  firstLineClaimWinner: {
    type: Array,
    ref: 'users'
  },
  secondLineClaimWinner: {
    type: Array,
    ref: 'users'
  },
  thirdLineClaimWinner: {
    type: Array,
    ref: 'users'
  },
  fullHouseClaimWinner: {
    type: Array,
    ref: 'users'
  },
  jaldiWinners: {
    type: Number,
    default: 0
  },
  cornerWinners: {
    type: Number,
    default: 0
  },
  cornersClaimWinner: {
    type: Array,
    ref: 'users'
  },
  jaldiClaimWinners: {
    type: Array,
    ref: 'users'
  },
  // per head win amount
  firstLinePerHeadWinAmount: {
    type: Number,
    default: 0
  },
  secondLinePerHeadWinAmount: {
    type: Number,
    default: 0
  },
  thirdLinePerHeadWinAmount: {
    type: Number,
    default: 0
  },
  fullHousiePerHeadWinAmount: {
    type: Number,
    default: 0
  },
  jldiPerHeadWinAmount: {
    type: Number,
    default: 0
  },
  cornerPerHeadWinAmount: {
    type: Number,
    default: 0
  },
},
{
  timestamps: true
});

module.exports = mongoose.model('claimPrize', claimPrize);