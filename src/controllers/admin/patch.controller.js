const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { patchService } = require('../../services/admin');
const message = require('../../utils/message');

const createPatch = catchAsync(async (req, res) => {
  const patch = await patchService.createPatch(req.body);
  res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.PATCH_CREATED, { result:patch });
});

const getPatch = catchAsync(async (req, res) => {
    const patch = await patchService.getPatch(req.params.patchId);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.PATCH_FOUND, { result:patch });
});

const listPatch = catchAsync(async (req, res) => {
    const patches = await patchService.listPatch(req.body);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.PATCH_FOUND, { ...patches });
});

const editPatch = catchAsync(async (req, res) => {
    const patch = await patchService.editPatch(req.body,req.user);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.PATCH_UPDATED, { result:patch });
});

const deletePatch = catchAsync(async (req, res) => {
    const patch = await patchService.deletePatch(req.params.patchId);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.PATCH_DELETED);
});

module.exports = {
    createPatch,
    getPatch,
    listPatch,
    editPatch,
    deletePatch,
}