const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const message = require('../../utils/message');
const { userService } = require('../../services/admin');

const changePassword = catchAsync(async (req, res) => {
    await userService.changePassword(req.user._id,req.body);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.USER_UPDATED, {});
});

module.exports = {
    changePassword,
}