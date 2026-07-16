const express = require('express');
const validate = require('../../../middlewares/validate');
const { uploadValidation } = require('../../../validations/admin');
const { uploadController } = require('../../../controllers/admin');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/url', auth(), validate(uploadValidation.getUploadUrl), uploadController.getUploadUrl);

module.exports = router;
