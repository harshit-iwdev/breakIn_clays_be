const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const { categoryService } = require("../../services/app");
const message = require("../../utils/message");

const listCategory = catchAsync(async (req, res) => {
  const categories = await categoryService.listCategory(req.body, req.user._id);
  console.log(categories.totalRecords);
  res.sendJSONResponse(
    httpStatus.OK,
    true,
    message.sucessfull_message.CATEGORY_FOUND,
    { ...categories }
  );
});

const getCategory = catchAsync(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.categoryId);
  res.sendJSONResponse(
    httpStatus.OK,
    true,
    message.sucessfull_message.CATEGORY_FOUND,
    { result: category }
  );
});

const addFavoriteCategory = catchAsync(async (req, res) => {
  const favoriteCategoryIds = await categoryService.addFavoriteCategory(
    req.params.categoryId,
    req.user._id
  );
  res.sendJSONResponse(httpStatus.OK, true, "Category added to favorites.", {
    favoriteCategoryIds,
  });
});

const removeFavoriteCategory = catchAsync(async (req, res) => {
  const favoriteCategoryIds = await categoryService.removeFavoriteCategory(
    req.params.categoryId,
    req.user._id
  );
  res.sendJSONResponse(httpStatus.OK, true, "Category removed from favorites.", {
    favoriteCategoryIds,
  });
});

const listSponsor = catchAsync(async (req, res) => {
  const sponsors = await categoryService.listSponsor(req.body);
  res.sendJSONResponse(
    httpStatus.OK,
    true,
    message.sucessfull_message.SPONSOR_FOUND,
    { ...sponsors }
  );
});

module.exports = {
  listCategory,
  getCategory,
  listSponsor,
  addFavoriteCategory,
  removeFavoriteCategory,
};
