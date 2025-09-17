const mongoose = require('mongoose');
const userDeviceSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
      required: true,
    },
    appEnvironment: {
      type: String,
      //enum: ["development", "staging", "production", "uat", "qa", "local"],
      required: true,
      default:"development",
    },
    deviceType: {
      type: String,
      //enum: ["ios", "android", "web"],
      required: true,
      default:"web",
    },
    deviceName: {
      type: String,
      required: true,
      default:"unknown",
    },
    deviceId: {
      type: String,
      required: true,
    },
    deviceVersion: {
      type: String,
      required: true,
      default:"unknown",
    },
    appVersion: {
      type: String,
      required: true,
      default:"unknown",
    },
    deviceToken: {
      type: String,
      required: false,
    },
    osVersion: {
      type: String,
      required: true,
      default:"unknown",
    },
    ipAddress: {
      type: String,
      required: true,
      default:"unknown",
    },
    loggedInDate: {
      type: String,
      required: false,
    },
    isActive: {
      type: Boolean,
      required: true,
      default:true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * @typedef UserDevice
 */
const UserDevice = mongoose.model('UserDevice', userDeviceSchema);

module.exports = UserDevice;