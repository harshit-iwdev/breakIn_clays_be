const mongoose = require('mongoose');

const scoreRoundSchema = mongoose.Schema(
  {
    roundNo:{
      type: Number,
      required: true,
    },
    postIds:{
      type: Array,
      required: true,
    },
    scoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Score",
      required: false,
    },
    roundShots: {
      type: Number,
      required: false,
    },
    roundScore: {
      type: Number,
      required: false,
    },
    note: {
      type: String,
      required: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

/**
 * @typedef ScoreRound
 */
const ScoreRound = mongoose.model('ScoreRound', scoreRoundSchema);

module.exports = ScoreRound;