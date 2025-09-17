const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { gunDetailService } = require('../../services/admin');
const message = require('../../utils/message');

const listGunDetail = catchAsync(async (req, res) => {
    const gunDetails = await gunDetailService.listGunDetail(req.body);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.GUN_DETAIL_FOUND, { ...gunDetails });
});

const createGunDetail = catchAsync(async (req, res) => {
    const gunDetail = await gunDetailService.createGunDetail(req.body);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.GUN_DETAIL_CREATED, { result:gunDetail });
});

const getGunDetail = catchAsync(async (req, res) => {
    const gunDetail = await gunDetailService.getGunDetail(req.params.gunDetailId);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.GUN_DETAIL_FOUND, { result:gunDetail });
});

const getGunTypes = catchAsync(async (req, res) => {
    const gunDetail = await gunDetailService.getGunTypes();
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.GUN_DETAIL_FOUND, { result:gunDetail });
});

const editGunDetail = catchAsync(async (req, res) => {
    const gunDetail = await gunDetailService.editGunDetail(req.body);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.GUN_DETAIL_UPDATED, { result:gunDetail });
});

const deleteGunDetail = catchAsync(async (req, res) => {
    const gunDetail = await gunDetailService.deleteGunDetail(req.params.gunDetailId);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.GUN_DETAIL_DELETED, { });
});

module.exports = {
    listGunDetail,
    createGunDetail,
    getGunDetail,
    getGunTypes,
    editGunDetail,
    deleteGunDetail,
}