const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const user = require('./users');

const schema = new Schema({
  fee: {
    type: Number,
    required: true,
    default:5
  },
  amount: {
    type: Number,
    required: true
  },
  withdrawal_amount: {
    type: Number,
    required: true
  },
  wallet_balance:{
    type:Number,
    required:true
  },
  status: {
    type: String,
    enum: ['processing', 'accept', 'reject','declined','cancelled'],
    default:'processing'
  },
  description: {
    type: String,
    required: false,
    default:''
  },
  updated_on: {
    type: Date,
    required: false
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'users'
  }
},
{
  timestamps: true
});

module.exports = mongoose.model('withdrawRequests', schema);