const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const { scoreService } = require("../../services/app");
const message = require("../../utils/message");
const crypto = require("crypto");

const createScore = catchAsync(async (req, res) => {
  const score = await scoreService.createScore(req.body, req.user._id);
  res.sendJSONResponse(
    httpStatus.OK,
    true,
    message.sucessfull_message.SCORE_CREATED,
    { result: score }
  );
});

const editScore = catchAsync(async (req, res) => {
  const score = await scoreService.editScore(req.body, req.user._id);
  res.sendJSONResponse(
    httpStatus.OK,
    true,
    message.sucessfull_message.SCORE_UPDATED,
    { result: score }
  );
});

const softDeleteScore = catchAsync(async (req, res) => {
  const score = await scoreService.softDeleteScore(req, req.user._id);
  res.sendJSONResponse(
    httpStatus.OK,
    true,
    message.sucessfull_message.SCORE_DELETED,
    { result: score }
  );
});

const getScore = catchAsync(async (req, res) => {
  const score = await scoreService.getScore(req.params.scoreId, req.user._id);
  res.sendJSONResponse(
    httpStatus.OK,
    true,
    message.sucessfull_message.SCORE_FOUND,
    { result: score }
  );
});

const listScore = catchAsync(async (req, res) => {
  const score = await scoreService.listScore(req.body, req.user._id);
  res.sendJSONResponse(
    httpStatus.OK,
    true,
    message.sucessfull_message.SCORE_FOUND,
    { ...score }
  );
});

const userGunList = catchAsync(async (req, res) => {
  const gunList = await scoreService.userGunList(req.body.search, req.user._id);
  res.sendJSONResponse(
    httpStatus.OK,
    true,
    message.sucessfull_message.GUN_FOUND,
    { ...gunList }
  );
});

const getHighestStreak = catchAsync(async (req, res) => {
  await scoreService.getHighestStreak(req.body.rounds);
  res.sendJSONResponse(
    httpStatus.OK,
    true,
    message.sucessfull_message.GUN_FOUND,
    {}
  );
});

const scorePDF = catchAsync(async (req, res) => {
  const length = Math.floor(Math.random() * 3) + 8;
  let randomStr = crypto
    .randomBytes(length)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, length);
  const score = await scoreService.getScorePDF(req.body);
  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${randomStr}-score.pdf"`,
  });
  res.send(score);
});

module.exports = {
  createScore,
  editScore,
  getScore,
  softDeleteScore,
  listScore,
  userGunList,
  scorePDF,
  getHighestStreak,
};
