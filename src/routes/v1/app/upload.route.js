const express = require('express');
const validate = require('../../../middlewares/validate');
const { uploadValidation } = require('../../../validations/app');
const { uploadController } = require('../../../controllers/app');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/url', auth(), validate(uploadValidation.getUploadUrl), uploadController.getUploadUrl);

module.exports = router;
