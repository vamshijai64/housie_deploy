const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const user = require('./users');

const schema = new Schema({
  note: {
    type: String,
  },
  amount: {
    type: Number
  },
  activity_type: {
    type: String,
    enum: ['online_topup', 'online_play', 'wallet_topup', 'wallet_deduct', 'refund','withdraw_request']
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'users'
  }
},
{
  timestamps: true
});

module.exports = mongoose.model('userActivity', schema);