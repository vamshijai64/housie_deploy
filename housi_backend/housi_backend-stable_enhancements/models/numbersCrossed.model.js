const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  userId: {
    type: String,
    ref: 'users',
    required: true
  },
  ticketId: {
      type: String,
      required: true
  },
  numbersCrossed_admin: [
    {
      number: { type: Number },
      timestamp: { type:String  },
      firstrow: { type: Boolean, default: false },
      secondrow: { type: Boolean, default: false },
      thirdrow: { type: Boolean, default: false },
      corners: { type: Boolean, default: false },
      jaldi: { type: Boolean, default: false },
      fullHousie: { type: Boolean, default: false },
      data: [],
    },     
  ],
   

numbersCrossed: {
  type: Array,
},
  gameId: {
      type: String,
      ref: 'games'
  }
},
{
  timestamps: true
});

module.exports = mongoose.model('numberCrossed', schema);