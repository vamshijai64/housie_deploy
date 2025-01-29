const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
  },
  refered_by: {
    type: Schema.Types.ObjectId,
  },
  code: {
    type: String
  },
  status: {
    type: Number
  },
  amount: {
    type: Number
  },
  totalAmount: {
    type: Number
  }
},
{
  timestamps: true
});

module.exports = mongoose.model('referalsData', schema);