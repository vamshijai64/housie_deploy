const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const islands = require('./islands');
const boat = require('./boat');
const boatOwner = require('./boatOwner');
const trip = require('./trip');
const user = require('./users');

const schema = new Schema({
  departure: {
    type: Schema.Types.ObjectId,
    ref: 'islands'
  },
  arrival: {
    type: Schema.Types.ObjectId,
    ref: 'islands'
  },
  journey_date: {
    type: Date
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'users'
  },
  passenger_details: {
    adult: {
      type: Number
    },
    infant: {
      type: Number
    },
    children: {
      type: Number
    },
    seat_no: [{
      type: Number
    }]
  },
  trip_id: {
    type: Schema.Types.ObjectId,
    ref: 'trip'
  },
  boat_id: {
    type: Schema.Types.ObjectId,
    ref: 'boat'
  },
  boat_owner_id: {
    type: Schema.Types.ObjectId,
    ref: 'boatOwner'
  },
  total_amount: {
    type: Number
  },
  transaction_details: {
    type: Object
  },
  barcode: {
    type: String,
    unique: true
  },
  booking_status: {
    type: String,
    enum: ["booked", "pending", "cancelled", "completed", "expired", "failed"],
    default: "pending"
  },
  payment_mode: {
    type: String,
    enum: ["wallet", "online"]
  },
  order_id: {
    type: String,
  },
  admin_commission_type: {
    type: String,
    required: true,
    default: 'percentage'
  },
  admin_commission: {
    type: String,
    required: true,
    default: 0
  },
  calculated_admin_commission: {
    type: Number,
    default: 0
  },
  booked_for_user: {
    type: String
  },
  user_role: {
    type: String,
    enum: ['user', 'agent'],
    default: 'user'
  },
  cancelled_passenger_details: {
    adult: {
      type: Number,
      default: 0
    },
    infant: {
      type: Number,
      default: 0
    },
    children: {
      type: Number,
      default: 0
    },
    cancel_date: [{
      type: Date
    }]
  },
  is_cancelled_ticket: {
    type: Boolean,
    default: false
  },
  total_refund: {
    type: Number,
    default: 0
  },
  luggage_count: {
    type: Number,
    default: 0
  },
  promoCode: {
    type: Object
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('bookings', schema);