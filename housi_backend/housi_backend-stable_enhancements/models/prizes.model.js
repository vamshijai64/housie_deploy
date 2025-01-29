const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const prizes = new Schema({
  gameId: {
    type: String,
    ref: 'games'
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'users'
  },
  jaldiWinner: {
    type: Number,
    default: 0
  },
  cornerWinner: {
    type: Number,
    default: 0
  },
  firstRowWinner: {
    type: Number,
    default: 0
  },
  secondRowWinner: {
    type: Number,
    default: 0
  },
  thirdRowWinner: {
    type: Number,
    default: 0
  },
  fullHousiWinner: {
    type: Number,
    default: 0
  },
  prize:{
    type: Number,
    default: 0
  },
  ticketId:{
    type:String,
    default:''
  }
},
{
  timestamps: true
});

module.exports = mongoose.model('prizes', prizes);