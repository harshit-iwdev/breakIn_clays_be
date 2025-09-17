const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const LogSchema = new Schema(
  {
    url: String,
    headers: Object,
    method: String,
    params: Object,
    ip_address: String,
    start_time: String,
    end_time: String,
    time: Date,
    status: String,
    response: Object,
    user: Object,
    stack: String,
    logType:{
      type:String,
      enum:['error','API'],
      default:'API',
    },
  },
  {
    collection: 'logs',
    versionKey: false,
    timestamps: true,
  }
);

module.exports = mongoose.model('logs', LogSchema);