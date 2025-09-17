const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { videoService } = require('../../services/app');
const message = require('../../utils/message');

const listVideo = catchAsync(async (req, res) => {
    const videos = await videoService.listVideo(req.body);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.VIDEO_FOUND, { ...videos });
});

module.exports = {
    listVideo,
}