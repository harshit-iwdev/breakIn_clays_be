const express = require('express');
const validate = require('../../../middlewares/validate');
const {sponsorValidation} = require('../../../validations/admin');
const {sponsorController} = require('../../../controllers/admin');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/',auth(), validate(sponsorValidation.list), sponsorController.listSponsor);
   
router.post('/create',auth(), validate(sponsorValidation.create), sponsorController.createSponsor);
router.put('/edit',auth(), validate(sponsorValidation.edit), sponsorController.editSponsor);

router
  .route('/:sponsorId')
  .get(auth(), validate(sponsorValidation.get), sponsorController.getSponsor)
  .delete(auth(), validate(sponsorValidation.deleteSponsor), sponsorController.deleteSponsor);
   
module.exports = router;