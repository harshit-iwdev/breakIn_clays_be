const Joi = require('joi');
const { objectId } = require('../custom.validation');

const edit = {
  body: Joi.object().keys({
    link: Joi.string().required(),
  }),
};

const get = {
  params: Joi.object().keys({
    marketId: Joi.string().required().custom(objectId),
  })
};

module.exports = {
    edit,
    get,
}