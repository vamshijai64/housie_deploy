const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  _id: {
    type: String,
    required: true
  },
  count: {
      type: Number,
      required: true
  }
},
{
  timestamps: true
});

module.exports = mongoose.model('counters', schema);