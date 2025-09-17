const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { categoryService } = require('../../services/admin');
const message = require('../../utils/message');

const listCategory = catchAsync(async (req, res) => {
    const categories = await categoryService.listCategory(req.body);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.CATEGORY_FOUND, { ...categories });
});

const createCategory = catchAsync(async (req, res) => {
    const category = await categoryService.createCategory(req.body);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.CATEGORY_CREATED, { result:category });
});

const getCategory = catchAsync(async (req, res) => {
    const category = await categoryService.getCategoryById(req.params.categoryId);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.CATEGORY_FOUND, { result:category });
});
  
module.exports = {
    listCategory,
    createCategory,
    getCategory,
}