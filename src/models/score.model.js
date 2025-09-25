const mongoose = require("mongoose");
const { SCORE_EVENT_TYPE } = require("../config/config");

const scoreSchema = mongoose.Schema(
  {
    location: {
      type: String,
      required: true,
    },
    longitude: {
      type: String,
      required: false,
    },
    latitude: {
      type: String,
      required: false,
    },
    scoreDate: {
      type: Date,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: false,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: false,
    },
    isEventDeleted: {
      type: Boolean,
      default: false,
      required: false,
    },
    gunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GunSafe",
      required: false,
    },
    eventType: {
      type: String,
      enum: SCORE_EVENT_TYPE,
      required: false,
    },
    noOfRounds: {
      type: Number,
      required: true,
    },
    handicap: {
      type: String,
      required: false,
    },
    totalShots: {
      type: Number,
      required: false,
    },
    totalScore: {
      type: Number,
      required: false,
    },
    roundIds: {
      type: Array,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    scoreImage: {
      type: String,
      required: false,
    },
    scoreImageName: {
      type: String,
      required: false,
    },
    isDraft: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * @typedef Score
 */
const Score = mongoose.model("Score", scoreSchema);

module.exports = Score;
