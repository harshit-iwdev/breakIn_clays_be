const mongoose = require('mongoose');
const { QUERY_TYPE } = require('../config/config');

const querySchema = mongoose.Schema(
  {
    queryNo: {
      type: String,
      required: true,
      unique: true
    },
    subject: {
      type: String,
      required: true,
    },
    query: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum:QUERY_TYPE,
      required: true,
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

/**
 * @typedef Query
 */
const Query = mongoose.model('Query', querySchema);

module.exports = Query;