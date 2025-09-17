const Joi = require('joi');
const { password } = require('./custom.validation');

const register = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.alternatives().conditional('socialToken', {
      is: Joi.exist().not(null),
      then: Joi.forbidden(),
      otherwise: Joi.string().required().custom(password),
    }),
    confirmPassword: Joi.alternatives().conditional('socialToken', {
      is: Joi.exist().not(null),
      then: Joi.forbidden(),
      otherwise: Joi.string().required().custom(password),
    }),
    name: Joi.string().required(),
    userName: Joi.string().required(),
    profileImage: Joi.string(),
    socialToken: Joi.string().allow(null),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
  }),
};

const socialLogin = {
  body: Joi.object().keys({
    socialToken: Joi.string().required(),
  }),
};

const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

const resetPassword = {
  body: Joi.object().keys({
    token: Joi.string().required(),
    password: Joi.string().required().custom(password),
  }),
};

const verifyEmail = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    otp: Joi.number().required(),
  }),
};

const deleteUserEmail = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    otp: Joi.number().required(),
  }),
};

const forceUpdate = {
  body:  Joi.object({
    device_type: Joi.string().valid('IOS','ANDROID').required(),
    app_version: Joi.string().required()
  })
};

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  verifyEmail,
  socialLogin,
  deleteUserEmail,
  forceUpdate,
};
