const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const { sideMenuService } = require("../../services/app");

const getAffiliate = catchAsync(async (req, res) => {
  const affiliate = await sideMenuService.getAffiliate();
  res.sendJSONResponse(httpStatus.OK, true, "Affiliate link found.", {
    result: affiliate,
  });
});

const getMarket = catchAsync(async (req, res) => {
  const maket = await sideMenuService.getMarket();
  res.sendJSONResponse(httpStatus.OK, true, "Store link found.", {
    result: maket,
  });
});

module.exports = {
  getAffiliate,
  getMarket,
};
