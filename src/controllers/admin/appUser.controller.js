const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { appUserService } = require('../../services/admin');
const message = require('../../utils/message');

const listAppUser = catchAsync(async (req, res) => {
    const users = await appUserService.listAppUser(req.body);
    res.sendJSONResponse(httpStatus.OK, true,"App users found", { ...users });
});

const listUserPatch = catchAsync(async (req, res) => {
    const patches = await appUserService.listUserPatch(req.params.userId);
    res.sendJSONResponse(httpStatus.OK, true,"user patches found", { ...patches });
});

const listUserEvents = catchAsync(async (req, res) => {
    const events = await appUserService.listUserEvents(req.body);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.EVENT_FOUND, { ...events });
});

module.exports = {
    listAppUser,
    listUserPatch,
    listUserEvents,
}