const express = require('express');
const validate = require('../../../middlewares/validate');
const {categoryValidation} = require('../../../validations/app');
const {categoryController} = require('../../../controllers/app');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/',auth(), validate(categoryValidation.list), categoryController.listCategory);
router.post('/sponsor',auth(), validate(categoryValidation.listSponsor), categoryController.listSponsor);
   
router
.route('/:categoryId')
.get(auth(), validate(categoryValidation.get), categoryController.getCategory);

module.exports = router;