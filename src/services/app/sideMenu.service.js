const httpStatus = require("http-status");
const { MarketPlace, Affiliate } = require("../../models");
const ApiError = require("../../utils/ApiError");
const mongoose = require("mongoose");

const getMarketById = async () => {
  const marketPlace = await MarketPlace.findOne({ isDeleted: false });
  if (!marketPlace) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Store place not found.");
  }
  return marketPlace;
};

const getMarket = async () => {
  return await getMarketById();
};

const getAffiliateById = async () => {
  const affiliate = await Affiliate.findOne({ isDeleted: false });
  if (!affiliate) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Affiliate links not found.");
  }
  return affiliate;
};

const getAffiliate = async () => {
  return await getAffiliateById();
};

module.exports = {
  getMarket,
  getAffiliate,
};
