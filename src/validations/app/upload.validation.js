const Joi = require('joi');

const getUploadUrl = {
  body: Joi.object().keys({
    fileName: Joi.string().required(),
    contentType: Joi.string(),
  }),
};

module.exports = {
  getUploadUrl,
};
