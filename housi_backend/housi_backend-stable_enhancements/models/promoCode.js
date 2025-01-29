const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const user = require('./users');
const schema = new Schema({
  code: {
    type: String,
    required: true
  },
  discount: {
    type: Number,
    required: true
  },
  discount_type: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  is_available: {
    type: Boolean,
    default: false
  },
  user_id: [{
    type: Schema.Types.ObjectId,
    ref: 'users'
  }],
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date,
    required: true
  },
  redeem_count: {
    type: Number,
    required: true
  },
  island_from: {
    type: Schema.Types.ObjectId,
    ref: 'islands',
    required: true
  },
  island_to: {
    type: Schema.Types.ObjectId,
    ref: 'islands',
    required: true
  }
},{
  timestamps: true
});

module.exports = mongoose.model('promoCode', schema);