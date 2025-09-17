const express = require('express');
const validate = require('../../../middlewares/validate');
const authValidation = require('../../../validations/admin/auth.validation');
const authController = require('../../../controllers/admin/auth.controller');

const router = express.Router();

router.post('/login', validate(authValidation.login), authController.login);
router.post('/logout', validate(authValidation.logout), authController.logout);
router.post('/refresh-token', validate(authValidation.refreshTokens), authController.refreshTokens);

module.exports = router;