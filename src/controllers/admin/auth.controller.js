const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const message = require('../../utils/message');
const { authService, tokenService } = require('../../services/admin');

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.LOGIN, { user, tokens});
});
  
const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.LOGOUT, {});
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.REFRESH, { tokens});});

module.exports = {
  login,
  logout,
  refreshTokens,
};
