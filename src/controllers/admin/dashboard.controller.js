const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { dashboardService } = require('../../services/admin');
const message = require('../../utils/message');

const allData = catchAsync(async (req, res) => {
  const allData = await dashboardService.dashboardData(req.body);
  res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.DATA_FOUND, { result:allData });
});

module.exports = {
    allData
}