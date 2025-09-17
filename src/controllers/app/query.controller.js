const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { queryService } = require('../../services/app');
const message = require('../../utils/message');

const createQuery = catchAsync(async (req, res) => {
    const query = await queryService.createQuery(req.body,req.user._id);
    res.sendJSONResponse(httpStatus.CREATED, true,message.sucessfull_message.INQUIRY_CREATED, { result:query });
});

module.exports = {
    createQuery,
}