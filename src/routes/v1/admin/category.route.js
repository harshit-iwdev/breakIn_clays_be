const express = require('express');
const validate = require('../../../middlewares/validate');
const {categoryValidation} = require('../../../validations/admin');
const {categoryController} = require('../../../controllers/admin');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/',auth(), validate(categoryValidation.list), categoryController.listCategory);
router.post('/create',auth(), categoryController.createCategory);
   
router
.route('/:categoryId')
.get(auth(), validate(categoryValidation.get), categoryController.getCategory);

module.exports = router;