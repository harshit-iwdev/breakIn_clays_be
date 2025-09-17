const Joi = require('joi');

const changePassword = {
  body: Joi.object()
    .keys({
      newPassword: Joi.string().required(),
      oldPassword: Joi.string().required(),
      confirmPassword: Joi.string().required(),
    })
};

module.exports = {
  changePassword,
};