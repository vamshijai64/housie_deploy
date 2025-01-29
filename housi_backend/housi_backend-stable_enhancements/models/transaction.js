const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// const users = require('./users');

const schema = new Schema({
  amount: {
    type: Number,
    default:0
  },
  tds_amount: {
    type: Number,
    default:0
  },
  new_balance: {
    type: Number,
    default:0
  },
  old_balance: {
    type: Number,
    default:0
  },
  type: {
    type: String,
    enum: ['credit', 'debit', 'bonus','refund']
  },
  status: {
    type: String,
    enum: ['processing', 'accept', 'reject','failed','declined'],
    default:'processing'
  },
  description : {
    type: String,
    default:''
  },
  withdraw_id : {
    type: Schema.Types.ObjectId,
    ref:'withdrawRequests'
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'users'
  },
  gameId: {
    type: String,
    
  },
  ticket_id: {
    type: String,
    required:false
  },
  bonusAmount: {
    type: Number,
    required:false
  },
  BalanceAmount: {
    type: Number,
    required:false
  },
  winAmount: {
    type: Number,
    required:false
  },
  gstAmount: {
    type: Number,
    required:false
  },
  invoice : {
    type: String,
    default:''
  },
},{
  timestamps: true
});

module.exports = mongoose.model('transaction', schema);