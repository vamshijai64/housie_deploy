const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  question: {
    type: String,
    required: true
  },
  option_1: {
    type: String,
    required: true,
  },
  option_2: {
    type: String,
    required: true
  },
  image_name: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  set_id: {
    type: Schema.Types.ObjectId,
    ref: 'quiz',
    required: true
  }
},
{
  timestamps: true
});

module.exports = mongoose.model('questions', schema);