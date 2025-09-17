const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const message = require('../../utils/message');
const { analysisService } = require('../../services/app');
const crypto = require('crypto');

const analysisData = catchAsync(async (req, res) => {
  const analysis = await analysisService.getAnalysis(req.body,req.user);
  res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.ANALYSIS_FOUND, { result:analysis });
});

const analysisGuns = catchAsync(async (req, res) => {
  const guns = await analysisService.getAnalysisGuns(req.body,req.user._id);
  res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.GUN_FOUND, { results:guns });
});

const getAnalysisLocation = catchAsync(async (req, res) => {
  const locations = await analysisService.getAnalysisLocation(req.body,req.user._id);
  res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.GUN_FOUND, { results:locations });
});

const analysisPDF = catchAsync(async (req, res) => {
  const length = Math.floor(Math.random() * 3) + 8; // 8 to 10
  let randomStr = crypto.randomBytes(length).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, length);
  const analysis = await analysisService.getAnalysisPDF(req.body);
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${randomStr}-analysis.pdf"`,
  });
  res.send(analysis);
});

module.exports = {
    analysisData,
    analysisGuns,
    analysisPDF,
    getAnalysisLocation,
}