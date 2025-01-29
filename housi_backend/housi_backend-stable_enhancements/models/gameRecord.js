const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gamesRecord = new Schema({
  _id: {
    type:String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  totalWinnings: {
    type: String,
    required: true
  },
  fees: {
    type: Number,
    required: true
  },
  totalTickets: {
    type: Number,
    required: true
  },

  jaldiPrizeAmount: {
    type: Number,
    required: true
  },
  cornerPrizeAmount: {
    type: Number,
    required: true
  },
  firstLinePrizeAmount: {
    type: Number,
    required: true
  },
  secondLinePrizeAmount: {
    type: Number,
    required: true
  },
  thirdLinePrizeAmount: {
    type: Number,
    required: true
  },
  fullHousiePrizeAmount: {
    type: Number,
    required: true
  },
  jaldiWinners: {
    type: Number,
    required: true
  },
  cornerWinners: {
    type: Number,
    required: true
  },
  firstLineWinners: {
    type: Number,
    required: true
  },
  secondLineWinners: {
    type: Number,
    required: true
  },
  thirdLineWinners: {
    type: Number,
    required: true
  },
  fullHousieWinners: {
    type: Number,
    required: true
  },
  isMultiPlayer: {
    type: Number,
    required: true,
    default:1
  },
  status: {
    type: String,
    enum: ['active', 'inactive','completed','cancelled'],
    default:'active'
  },
  registrationStartTime: {
    type: Date,
    required: true
  },
  registrationStartDate: {
    type: Date,
    required: true
  },
  registrationCloseDate: {
    type: Date,
    required: true
  },
  registrationCloseTime: {
    type: Date,
    required: true
  },
  gameStartDate: {
    type: Date,
    required: true
  },
  gameStartTime: {
    type: Date,
    required: true
  },
  // calltime is a timer to throw numbers in room
  callTime: {
    type: Number,
    default:30
  },
  questionSet: {
    type: String,
    default:"April"
  },
  participants:[
    {
      name:{type:String},
      user_id:{type:String}
    }
  ],
  firstRowWinners:[],
  secondRowWinners:[],
  thirdRowWinners:[],
  fullHouseWinners:[]
},
{
  timestamps: true
});

module.exports = mongoose.model('gamesRecord', gamesRecord);