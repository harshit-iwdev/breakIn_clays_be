const httpStatus = require('http-status');
const tokenService = require('./../token.service');
const userService = require('./user.service');
const Token = require('../../models/token.model');
const ApiError = require('../../utils/ApiError');
const { tokenTypes } = require('../../config/tokens');

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await userService.getUserByEmail(email);

  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }

  user.lastLogin = new Date();
  
  await user.save();
  
  return user;
};

const logout = async (refreshToken) => {
  const result = await Token.deleteOne({ 
    token: refreshToken, 
    type: tokenTypes.REFRESH,
    blacklisted: false 
  });
  if (result.deletedCount === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Not record found.');
  }
};

const refreshAuth = async (refreshToken) => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
    const user = await userService.getUserById(refreshTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await refreshTokenDoc.deleteOne();
    return tokenService.generateAuthTokens(user);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
};

module.exports = {
  loginUserWithEmailAndPassword,
  logout,
  refreshAuth,
};
