const Joi = require('joi');
const { password, objectId } = require('./custom.validation');

const createUser = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    role: Joi.string().required().valid('user', 'admin'),
  }),
};

const getUsers = {
  query: Joi.object().keys({
    name: Joi.string(),
    role: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

const updateUser = {
  body: Joi.object()
    .keys({
      profileImage: Joi.string().allow(""),
      name: Joi.string().required(),
    })
};

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

const profileImageUpdate = {
  body: Joi.object().keys({
    profileImage: Joi.string().required(),
  }),
};

const changePassword = {
  body: Joi.object()
    .keys({
      newPassword: Joi.string().required(),
      oldPassword: Joi.string().required(),
      confirmPassword: Joi.string().required(),
    })
};

const listPatch = {
  body: Joi.object().keys({
    search: Joi.string().allow(''),
    limit: Joi.number(),
    page: Joi.number(),
    categoryId: Joi.string().custom(objectId),
  }),
};

const listNotification = {
  body: Joi.object().keys({
    limit: Joi.number(),
    page: Joi.number(),
  }),
};

const readNotification = {
  body: Joi.object().keys({
    notificationIds: Joi.array(),
  }),
};

const deleteNotification = {
  body: Joi.object().keys({
    notificationIds: Joi.array(),
  }),
};

const premiumUser = {
  body: Joi.object().keys({
    isPremium: Joi.boolean().required(),
  }),
};

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  profileImageUpdate,
  changePassword,
  listPatch,
  listNotification,
  readNotification,
  deleteNotification,
  premiumUser,
};
