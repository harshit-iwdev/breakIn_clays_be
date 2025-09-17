const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { NOTIFICATION_TIME } = require('../config/config');

const userCalendarSchema = mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    date: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    alertType: {
      type: String,
      required: false,
      enum:NOTIFICATION_TIME
    },
    alertTime: {
      type: Date,
      required: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

userCalendarSchema.plugin(toJSON);
userCalendarSchema.plugin(paginate);

/**
 * @typedef UserCalendar
 */
const UserCalendar = mongoose.model('UserCalendar', userCalendarSchema);

module.exports = UserCalendar;
