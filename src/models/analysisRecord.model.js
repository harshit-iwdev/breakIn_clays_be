const mongoose = require('mongoose');

const analysisRecordSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recordDate: {
      type: Date,
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
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
 * @typedef AnalysisRecord
 */
const AnalysisRecord = mongoose.model('AnalysisRecord', analysisRecordSchema);

module.exports = AnalysisRecord;