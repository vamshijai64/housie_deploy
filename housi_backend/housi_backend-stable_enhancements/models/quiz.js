const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  name: {
    type: String,
    required: true
  },
  question:[
    {
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
      }
    }
  ],
  status:{
    type:Number,
    default:1
  }
},
{
  timestamps: true
});

module.exports = mongoose.model('quiz', schema);