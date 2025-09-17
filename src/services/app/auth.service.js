const httpStatus = require('http-status');
const tokenService = require('./../token.service');
const userService = require('./user.service');
const Token = require('../../models/token.model');
const ApiError = require('../../utils/ApiError');
const { tokenTypes } = require('../../config/tokens');
const { welcomeMail, forgotPassword } = require('../../utils/ses');
const { User, UserDevice } = require('../../models');

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await userService.getUserByEmail(email);
  if (!user || !user.password || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Incorrect email or password');
  }
  return user;
};

const socialLogin = async (socialToken) => {
  const user = await userService.getUserBySocialToken(socialToken);
  return user;
};

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise}
 */
const logout = async (refreshToken,headers) => {
  let deviceId = headers["device-id"];

  const result = await Token.findOneAndDelete({ 
    token: refreshToken, 
    type: tokenTypes.REFRESH, 
    blacklisted: false 
  });

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Not record found.');
  }

  await UserDevice.deleteMany({ userId: result.user, deviceId:deviceId });

};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
const refreshAuth = async (refreshToken) => {
  try {
    console.log("🚀 ~ refreshAuth ~ refreshToken:", refreshToken)
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
    const user = await userService.getUserById(refreshTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await refreshTokenDoc.deleteOne();
    return tokenService.generateAuthTokens(user);
  } catch (error) {
    console.log("🚀 ~ refreshAuth ~ error:", error)
    throw new ApiError(httpStatus.BAD_REQUEST, 'Please authenticate');
  }
};

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @returns {Promise}
 */
const resetPassword = async (resetPasswordToken, newPassword) => {
  try {
    const resetPasswordTokenDoc = await tokenService.verifyToken(resetPasswordToken, tokenTypes.RESET_PASSWORD);
    const user = await userService.getUserById(resetPasswordTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await userService.resetPassword(user.id, newPassword);
    await Token.deleteMany({ user: user.id, type: tokenTypes.RESET_PASSWORD });
  } catch (error) {
    console.log("🚀 ~ resetPassword ~ error:", error)
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Password reset failed');
  }
};

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise}
 */
const verifyEmail = async (verifyEmailToken) => {
  try {
    const verifyEmailTokenDoc = await tokenService.verifyToken(verifyEmailToken, tokenTypes.VERIFY_EMAIL);
    const user = await userService.getUserById(verifyEmailTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await Token.deleteMany({ user: user.id, type: tokenTypes.VERIFY_EMAIL });
    await userService.updateUserById(user.id, { isEmailVerified: true });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Email verification failed');
  }
};

const sendResetPasswordEmail = async (to, token) => {

  const user = await User.findOne({email:to,isDeleted:false});
  if(!user){
    throw new ApiError(httpStatus.NOT_FOUND, 'No user found');
  }
  const resetPasswordUrl = `${process.env.RESET_URI}?token=${token}`;

  let dynamicObj = {
    user:user.name,
    url:resetPasswordUrl
  }

  await forgotPassword(user.email,dynamicObj);

};


const resendWelcomeEmail = async (email) => {

  const user = await User.findOne({email:email,isDeleted:false});
  if(!user){
    throw new ApiError(httpStatus.NOT_FOUND, 'No user found. Please register a new one.');
  }
  if(user.isEmailVerified){
    throw new ApiError(httpStatus.BAD_REQUEST, 'User already verified.');
  }
  
  let otp = Math.floor(100000 + Math.random() * 900000);
  user.otp = otp;

  await user.save();

  let dynamicObj = {
    user:user.name,
    otp:otp
  }

  await welcomeMail(user.email,dynamicObj);

  return user;
};

module.exports = {
  loginUserWithEmailAndPassword,
  logout,
  refreshAuth,
  resetPassword,
  verifyEmail,
  socialLogin,
  sendResetPasswordEmail,
  resendWelcomeEmail,
};
