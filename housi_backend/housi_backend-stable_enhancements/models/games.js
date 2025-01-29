const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  _id: {
    type: String,
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
  isGameType:{
    type:String,
   default:"",
    required:false
  },
  gameNotificationTime: {
    type: Number,
    required: false
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
    default: 1
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed', 'cancelled','inprogress'],
    default: 'active'
  },
  // registrationStartTime: {
  //   type: Date,
  //   required: true
  // },
  // registrationStartDate: {
  //   type: Date,
  //   required: true
  // },
  // registrationCloseDate: {
  //   type: Date,
  //   required: true
  // },
  // registrationCloseTime: {
  //   type: Date,
  //   required: true
  // },
  registrationStartDateTime: {
    type: Date,
    required: true
  },
  registrationCloseDateTime: {
    type: Date,
    required: true
  },
  gameStartDateTime: {
    type: Date,
    required: true
  },
  bonusPercentage: {
    type: Number,
    required: true
  },
  conformationLeague: {
    type: Boolean,
    required: true
  },
  multipleEntry: {
    type: Boolean,
    required: true
  },
  prizeClaim : {
   type: String,
   default: "0"
  },

  // gameStartDate: {
  //   type: Date,
  //   required: true
  // },
  // gameStartTime: {
  //   type: Date,
  //   required: true
  // },
  // calltime is a timer to throw numbers in room
  callTime: {
    type: Number,
    default: 20
  },
  questionSet: {
    type: String,
    default: "April"
  },
  Participants: [
    {
      name: { type: String },
      user_id: { type: String }
    }
  ],
  jaldiFive: [
    {
      firstCol: { type: Number },
      secondCol: { type: Number },
      thirdCol: { type: Number },
    }
  ],
  fourCorners: [
    {
      firstCol: { type: Number },
      secondCol: { type: Number },
      thirdCol: { type: Number },
    }
  ],
  firstLine: [
    {
      firstCol: { type: Number },
      secondCol: { type: Number },
      thirdCol: { type: Number },
    }
  ],
  secondLine: [
    {
      firstCol: { type: Number },
      secondCol: { type: Number },
      thirdCol: { type: Number },
    }
  ],
  thirdLine: [
    {
      firstCol: { type: Number },
      secondCol: { type: Number },
      thirdCol: { type: Number },
    }
  ],
  fullHousie: [
    {
      firstCol: { type: Number },
      secondCol: { type: Number },
      thirdCol: { type: Number },
    }
  ]
},
  {
    timestamps: true
  });

module.exports = mongoose.model('games', schema);