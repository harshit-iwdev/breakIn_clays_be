const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const { marketPlaceService } = require("../../services/admin");
const message = require("../../utils/message");

const getMarketPlace = catchAsync(async (req, res) => {
  const market = await marketPlaceService.getMarket();
  res.sendJSONResponse(httpStatus.OK, true, "Store link found.", {
    result: market,
  });
});

const editMarketPlace = catchAsync(async (req, res) => {
  const market = await marketPlaceService.editMarket(req.body);
  res.sendJSONResponse(httpStatus.OK, true, "Store link updated", {
    result: market,
  });
});

module.exports = {
  getMarketPlace,
  editMarketPlace,
};
