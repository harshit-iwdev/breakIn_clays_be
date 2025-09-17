const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { sponsorService } = require('../../services/admin');
const message = require('../../utils/message');

const createSponsor = catchAsync(async (req, res) => {
  const sponsor = await sponsorService.createSponsor(req.body);
  res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.SPONSOR_CREATED, { result:sponsor });
});

const getSponsor = catchAsync(async (req, res) => {
    const sponsor = await sponsorService.getSponsor(req.params.sponsorId);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.SPONSOR_FOUND, { result:sponsor });
});

const listSponsor = catchAsync(async (req, res) => {
    const sponsors = await sponsorService.listSponsor(req.body);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.SPONSOR_FOUND, { ...sponsors });
});

const editSponsor = catchAsync(async (req, res) => {
    const sponsor = await sponsorService.editSponsor(req.body,req.user);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.SPONSOR_UPDATED, { result:sponsor });
});

const deleteSponsor = catchAsync(async (req, res) => {
    const sponsor = await sponsorService.deleteSponsor(req.params.sponsorId);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.SPONSOR_DELETED);
});

module.exports = {
    createSponsor,
    getSponsor,
    listSponsor,
    editSponsor,
    deleteSponsor,
}