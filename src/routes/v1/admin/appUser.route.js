const express = require('express');
const validate = require('../../../middlewares/validate');
const {appUserValidation} = require('../../../validations/admin');
const {appUserController} = require('../../../controllers/admin');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/',auth(), validate(appUserValidation.list), appUserController.listAppUser);

router.get('/:userId',auth(), validate(appUserValidation.getPatches), appUserController.listUserPatch);

router.post('/user-events',auth(), validate(appUserValidation.userEvents), appUserController.listUserEvents);

module.exports = router;