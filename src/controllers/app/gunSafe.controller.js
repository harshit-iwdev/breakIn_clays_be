const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { gunSafeService } = require('../../services/app');
const message = require('../../utils/message');

const createGunSafe = catchAsync(async (req, res) => {
  const gunSafe = await gunSafeService.createGun(req.body,req.user);
  res.sendJSONResponse(httpStatus.CREATED, true, message.sucessfull_message.GUN_CREATED, { result:gunSafe });
});

const editGunSafe = catchAsync(async (req, res) => {
  const gunSafe = await gunSafeService.editGun(req.body);
  res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.GUN_UPDATED, { result:gunSafe });
});

const getGunSafe = catchAsync(async (req, res) => {
    const gunSafe = await gunSafeService.getGun(req.params.gunId,req.user);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.GUN_FOUND, { result:gunSafe });
});

const listGunSafe = catchAsync(async (req, res) => {
  const gunList = await gunSafeService.listGunSafe(req.body,req.user._id);
  res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.GUN_FOUND, { ...gunList });
});

const listGunPart = catchAsync(async (req, res) => {
  const gunList = await gunSafeService.listGunPart(req.body,req.user);
  res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.GUN_FOUND, { ...gunList });
});

const deleteGunSafe = catchAsync(async (req, res) => {
  const gunSafe = await gunSafeService.deleteGun(req.params.gunId);
  res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.GUN_DELETED, { result:gunSafe });
});

module.exports = {
    createGunSafe,
    getGunSafe,
    listGunSafe,
    listGunPart,
    editGunSafe,
    deleteGunSafe,
}