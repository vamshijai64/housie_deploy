const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  code: {
    type: String,
    required: true
  },
  amount: {
    type: Number
  },
  isRedemed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('giftCard', schema);