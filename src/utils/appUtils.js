const Log = require('../models/log.model');

const getRandomString = (length = 30) => {
  var randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var result = '';
  for (var i = 0; i < length; i++) {
    result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
  }
  return result;
};

const logResponse = async ({ req, data, message, status, statusCode = 200 }) => {
  var startTime = +req._startTime;
  var endTime = +new Date();
  var user = req.user?req.user:'';
  var ip =
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null);

  var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

  var objLog = new Log({
    //uri: req.originalUrl,
    user:user,
    url: fullUrl,
    headers: req.headers,
    method: req.method,
    params: req.body,
    ip_address: ip,
    start_time: startTime,
    end_time: endTime,
    rtime: endTime - startTime,
    status: statusCode,
    response: { data, message, code: statusCode, status },
  });

  await objLog.save();
};

const logger = async ({ statusCode, responseObj, method, params, url }) => {
  const obj = {
    time: new Date(),
    methods: method,
    param: params,
    status_code: statusCode,
    response: responseObj,
    url: url,
  };

  return await Log.create({ ...obj });
};

//generate unique alpha numerice user define formate incremental code
const generateUniqueFormatNumber = (numberFormat) => {
  if (!numberFormat) throw new Error('string cannot be empty');
  var array = numberFormat.split(/[_/:\-;\\]+/);
  var lastSegment = array.pop();
  var priorSegment = numberFormat.substr(0, numberFormat.indexOf(lastSegment));
  var nextNumber = _alphaNumericIncrementer(lastSegment);
  return priorSegment + nextNumber;
};

//generate alpha numeric increment number accourding to param string value
const _alphaNumericIncrementer = (str) => {
  if (str && str.length > 0) {
    var invNum = str.replace(/([^a-z0-9]+)/gi, '');
    invNum = invNum.toUpperCase();
    var index = invNum.length - 1;
    while (index >= 0) {
      if (invNum.substr(index, 1) === '9') {
        invNum = invNum.substr(0, index) + '0' + invNum.substr(index + 1);
      } else if (invNum.substr(index, 1) === 'Z') {
        invNum = invNum.substr(0, index) + 'A' + invNum.substr(index + 1);
      } else {
        var char = String.fromCharCode(invNum.charCodeAt(index) + 1);
        invNum = invNum.substr(0, index) + char + invNum.substr(index + 1);
        index = 0;
      }
      index--;
    }
    return invNum;
  } else {
    throw new Error('str cannot be empty');
  }
};

module.exports = {
  getRandomString,
  logger,
  logResponse,
  generateUniqueFormatNumber,
};