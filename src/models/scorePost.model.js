const mongoose = require('mongoose');

const scorePostSchema = mongoose.Schema(
  {
    post: {
      type: Number,
      required: true,
    },
    postName: {
      type: String,
      required: true,
      enum:['POST','STATION','PEG']
    },
    shots:{
      type: Array,
      required: true,
    },
    roundId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScoreRound",
      required: true,
    },
    scoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Score",
      required: false,
    },
    postShots: {
      type: Number,
      required: false,
    },
    postScore: {
      type: Number,
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
 * @typedef ScorePost
 */
const ScorePost = mongoose.model('ScorePost', scorePostSchema);

module.exports = ScorePost;