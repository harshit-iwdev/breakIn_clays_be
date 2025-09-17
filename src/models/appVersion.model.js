const mongoose = require('mongoose');

const ModelConstants = Object.freeze({
  DEVICE_TYPE_IOS: 'IOS',
  DEVICE_TYPE_ANDROID: 'ANDROID',
});

const appVersionSchema = mongoose.Schema(
  {
    deviceType: {
      type: String,
      enum: [ModelConstants.DEVICE_TYPE_IOS, ModelConstants.DEVICE_TYPE_ANDROID],
    },
    requiredVersion: {
      type: Number,
      required: false,
      default: 1,
    },
    mandatory: {
      type: Boolean,
      required: true,
      default: true,
    },
    updateRequired: {
      type: Boolean,
      required: true,
      default: true,
    },
    appUrl: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
  },
  {
    collection: 'appversions',
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
    id: false,
  }
);


Object.assign(appVersionSchema.statics, ModelConstants);

/**
 * @typedef AppVersion
 */
const AppVersion = mongoose.model('AppVersion', appVersionSchema);

module.exports = AppVersion;