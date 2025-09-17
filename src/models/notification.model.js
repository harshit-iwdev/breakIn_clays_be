const mongoose = require('mongoose');

const ModelConstants = Object.freeze({

  SENDER_SOURCE_APP: 'app',
  SENDER_SOURCE_ADMIN: 'admin',
  USER_TYPES:['admin','app']
  
});

const notificationSchema = mongoose.Schema(
  {
    senderSource: {
      type: String,
      enum: ModelConstants.USER_TYPES,
      default: ModelConstants.SENDER_SOURCE_ADMIN,
    },
    receiverType: {
      type: String,
      enum: ModelConstants.USER_TYPES,
    },
    senderId: {
      type: mongoose.SchemaTypes.ObjectId,
      required: false,
      ref: 'User',
    },
    receiverId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    notifyType: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isSeen: {
      type: Boolean,
      default: false,
    },
    additionalData: {
      type: Object,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    collection: 'notifications',
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

Object.assign(notificationSchema.statics, ModelConstants);

/**
 * @typedef Notification
 */
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
