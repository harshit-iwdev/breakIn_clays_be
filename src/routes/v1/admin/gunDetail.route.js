const express = require('express');
const validate = require('../../../middlewares/validate');
const {gunDetailValidation} = require('../../../validations/admin');
const {gunDetailController} = require('../../../controllers/admin');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/',auth(), validate(gunDetailValidation.list), gunDetailController.listGunDetail);
router.get('/',auth(), gunDetailController.getGunTypes);
router.post('/create',auth(),validate(gunDetailValidation.create), gunDetailController.createGunDetail);
router.put('/edit',auth(),validate(gunDetailValidation.edit), gunDetailController.editGunDetail);
   
router
.route('/:gunDetailId')
.get(auth(), validate(gunDetailValidation.get), gunDetailController.getGunDetail)
.delete(auth(), validate(gunDetailValidation.deleteGunDetail), gunDetailController.deleteGunDetail);

module.exports = router;