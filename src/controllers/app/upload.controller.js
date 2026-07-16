const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { uploadService } = require('../../services/app');
const message = require('../../utils/message');

const getUploadUrl = catchAsync(async (req, res) => {
  const result = await uploadService.getUploadUrl(req.body);
  res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.UPLOAD_URL_GENERATED, { result });
});

module.exports = {
  getUploadUrl,
};
