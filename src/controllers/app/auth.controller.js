const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const message = require('../../utils/message');
const { authService, userService, tokenService, userDeviceService, appVersionService } = require('../../services/app');
const jwt = require('jsonwebtoken');

const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.USER_REGISTER, { result:{user, tokens} });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.LOGIN, { user, tokens});
});

const socialLogin = catchAsync(async (req, res) => {
    const { socialToken } = req.body;
    let isRegistered = false;
    let tokens = {};
    const user = await authService.socialLogin(socialToken);
    if(user){
      isRegistered = true;
      tokens = await tokenService.generateAuthTokens(user);
    }
  res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.LOGIN, { user, tokens, isRegistered });
});
  
const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken,req.headers);
  res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.LOGOUT, {});
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.REFRESH, {tokens});
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await authService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.FORGET_PASSWORD, {});
});

const resetPassword = catchAsync(async (req, res) => {
  const {token, password}=req.body;
  await authService.resetPassword(token, password);
  res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.RESET_PASSWORD, {});
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(httpStatus.NO_CONTENT).send();
});

const resendEmail = catchAsync(async (req, res) => {
  await authService.resendWelcomeEmail(req.body.email);
  res.sendJSONResponse(httpStatus.OK, true, "We have sent you an email with an One Time Passcode.", {});
});

const deviceRegister = catchAsync(async (req, res) => {    
  const { lang = "en" } = req.headers;
  let headers = req.headers;
  let deviceType = headers["device-type"];
  let objUserDevice = await userDeviceService.getUserDevice(
    req.user._id,
    deviceType,
    {
      deviceId: headers["device-id"],
    }
  );
  const user = await userService.getUserById(req.user._id);
  let userObj = JSON.parse(JSON.stringify(user));

  if (!objUserDevice) {
      headers.user_id = user._id;
      objUserDevice = await userDeviceService.createDevice(headers);
    }else if(objUserDevice){
      console.log("🚀 ~ deviceRegister ~ objUserDevice:", objUserDevice)
      headers.user_id = user._id;
      objUserDevice.deviceToken = headers["device-token"];
      console.log("🚀 ~ deviceRegister ~ objUserDevice:", objUserDevice)
      await objUserDevice.save();
    }
    
    res.sendJSONResponse(httpStatus.OK, true, "Device registered successfully ", { result:userObj });
});

const sendDeleteUserByOTP = catchAsync(async (req, res) => {
  await userService.sendDeleteUserByOTP(req.body);
  res.sendJSONResponse(httpStatus.OK, true, "We have sent you an email please check.", {});
});

const appleCallback = catchAsync(async (req, res) => {
  const { code, id_token } = req.body;

  const decodedToken = jwt.decode(id_token, { complete: true });
  console.log("User Info from ID Token", decodedToken);

  const packageId = 'com.breakinclays.app'; 
  const scheme = 'signinwithapple'; 
  const params = {
    code: 200,
    status: true,
    message: 'your token is refreshed',
    id_token: encodeURIComponent(id_token),
  };

  // Convert object to query string
  const query = new URLSearchParams(params).toString();
  console.log("🚀 ~ appleCallback ~ query:", query)

  // Build intent URI
  const intentURI = `intent://callback?${query}#Intent;package=${packageId};scheme=${scheme};end`;

  // Redirect the client to the intent URI
  res.redirect(intentURI);
//res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.REFRESH, { token: id_token});
});

const forceUpdate = catchAsync(async (req, res) => {
  const { device_type, app_version } = req.body;
  const appConfig = await appVersionService.checkAppVersion(device_type,app_version);
  res.sendJSONResponse(httpStatus.OK, true, "data found",{ result: appConfig });
});

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  verifyEmail,
  socialLogin,
  resendEmail,
  deviceRegister,
  sendDeleteUserByOTP,
  appleCallback,
  forceUpdate,
};
