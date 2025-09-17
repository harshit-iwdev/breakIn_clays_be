const express = require('express');
const validate = require('../../../middlewares/validate');
const {userValidation} = require('../../../validations/admin');
const {userController} = require('../../../controllers/admin');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/change-password',auth(), validate(userValidation.changePassword), userController.changePassword);

module.exports = router;