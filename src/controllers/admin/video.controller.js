const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { videoService } = require('../../services/admin');
const message = require('../../utils/message');

const createVideo = catchAsync(async (req, res) => {
  const video = await videoService.createVideo(req.body);
  res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.VIDEO_CREATED, { result:video });
});

const getVideo = catchAsync(async (req, res) => {
    const video = await videoService.getVideo(req.params.videoId);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.VIDEO_FOUND, { result:video });
});

const listVideo = catchAsync(async (req, res) => {
    const videos = await videoService.listVideo(req.body);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.VIDEO_FOUND, { ...videos });
});

const editVideo = catchAsync(async (req, res) => {
    const video = await videoService.editVideo(req.body,req.user);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.VIDEO_UPDATED, { result:video });
});

const deleteVideo = catchAsync(async (req, res) => {
    const video = await videoService.deleteVideo(req.params.videoId);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.VIDEO_DELETED);
});

module.exports = {
    createVideo,
    getVideo,
    listVideo,
    editVideo,
    deleteVideo,
}