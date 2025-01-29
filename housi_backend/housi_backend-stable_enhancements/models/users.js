const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  username: {
    type: String,
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  is_email_verified: {
    type: Boolean,
    required: false,
    default: false,
  },
  mobile: {
    type: String,
    required: false,
    unique: true
  },
  pincode: {
    type: String
  },
  is_mobile_verified: {
    type: Boolean,
    required: false,
    default: false,
  },
  callingCode: {
    type: String,
    default: '091'
  },
  dob: {
    type: String,
    required: false
  },
  gender: {
    type: String,
    default:""
  },
  address: {
    type: String,
    required: false
  },
  role: {
    type: String,
    enum: ['user', 'agent', 'admin'],
    default: 'user'
  },
  city: {
    type: String,
    required: false
  },
  country: {
    type: String,
    default: 'India',
  },
  state: {
    type: String
  },
  deviceToken: {
    type: Array,
    "default": [],
    required: false
  },
  isLoggedIn: {
    type: Boolean,
    required: true,
    default: true
  },
  isBlocked: {
    type: Number,
    default: 0
  },
  credit_points: {
    type: Number,
    default: 0
  },
  otp: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    required: false,
    default: ''
  },
  profile_image: {
    type: String,
    required: false,
    default:"https://housi.s3.amazonaws.com/folder/1669216445515_1669216445488.jpg"
  },
  last_login: {
    type: Date,
    required: false
  },
  status: {
    type: Boolean,
    "default": true
  },
  referral_code: {
    type: String,
    default: ''
  },
  referred_by: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: false
  },
  is_kyc_verified: {
    type: Boolean,
    default: false
  },
  bank: {
    bank_name: {
      type: String,
      required: false,
      default:""
    },
    account_holder: {
      type: String,
      required: false,
      default:""
    },
    account_number: {
      type: String,
      required: false,
      default:""
    },
    ifsc_code: {
      type: String,
      required: false,
      default:""
    },
    branch_name: {
      type: String,
      required: false,
      default:""
    }, 
    status: {
      type: String,
      required: false,
      default :""
    },
    time: {
      type: Date,
  required: false
    },
  },
  kyc: {
    aadhar_front: {
      image_name: {
        type: String,
        required: false
      },
      status: {
        type: String,
        required: false
      },
    },
    aadhar_back: {
      image_name: {
        type: String,
        required: false
      },
      status: {
        type: Boolean,
        required: false
      },
    },
    pancard: {
      image_name: {
        type: String,
        required: false,
        default :""
      },
      status: {
        type: String,
        required: false,
        default :""
      },
      time: {
        type: Date,
    required: false
      },
    },
    aadhar: {
      image_name: {
        type: String,
        required: false,
        default :""
      },
      status: {
        type: String,
        required: false,
        default :""
      },
      time: {
        type: Date,
    required: false
      },
    }
  },
  tickets: [
    {
      gameId: String,
      ticketName:String,
      ticket: []
    }
  ],
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  winAmount: {
    type: Number,
    default: 0
  },
  bonusWallet: {
    type: Number,
    default: 0
  },
  balanceWallet: {
    type: Number,
    default: 0
  },
  totalDepositAmount: {
    type: Number,
    default: 0
  },

  reffer_code: {
    type: String
  }
},




  {
    timestamps: true
  });

module.exports = mongoose.model('users', schema);