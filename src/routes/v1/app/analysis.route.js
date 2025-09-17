const express = require('express');
const validate = require('../../../middlewares/validate');
const {analysisValidation} = require('../../../validations/app');
const {analysisController} = require('../../../controllers/app');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/',auth(),validate(analysisValidation.get), analysisController.analysisData);

router.post('/pdf',auth(), analysisController.analysisPDF);

router.post('/guns',auth(),validate(analysisValidation.getGuns), analysisController.analysisGuns);

router.post('/locations',auth(),validate(analysisValidation.getLocations), analysisController.getAnalysisLocation);

module.exports = router;