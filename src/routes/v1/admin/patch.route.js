const express = require('express');
const validate = require('../../../middlewares/validate');
const {patchValidation} = require('../../../validations/admin');
const {patchController} = require('../../../controllers/admin');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/',auth(), validate(patchValidation.list), patchController.listPatch);
   
router.post('/create',auth(), validate(patchValidation.create), patchController.createPatch);
router.put('/',auth(), validate(patchValidation.edit), patchController.editPatch);

router
  .route('/:patchId')
  .get(auth(), validate(patchValidation.get), patchController.getPatch)
  .delete(auth(), validate(patchValidation.deletePatch), patchController.deletePatch);
   
module.exports = router;