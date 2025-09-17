const express = require('express');
const validate = require('../../../middlewares/validate');
const {gunSafeValidation} = require('../../../validations/app');
const {gunSafeController} = require('../../../controllers/app');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/',auth(), validate(gunSafeValidation.list), gunSafeController.listGunSafe);
   
router.post('/gun-parts',auth(), validate(gunSafeValidation.gunPartList), gunSafeController.listGunPart);
   
router.post('/add',auth(),validate(gunSafeValidation.create), gunSafeController.createGunSafe);
router.put('/',auth(), validate(gunSafeValidation.edit), gunSafeController.editGunSafe);

router
  .route('/:gunId')
  .get(auth(), validate(gunSafeValidation.get), gunSafeController.getGunSafe)
  .delete(auth(), validate(gunSafeValidation.deleteGun), gunSafeController.deleteGunSafe);
   
module.exports = router;