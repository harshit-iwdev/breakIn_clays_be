const Joi = require('joi');

const edit = {
  body: Joi.object().keys({
    link: Joi.string().required(),
  }),
};

module.exports = {
    edit,
}