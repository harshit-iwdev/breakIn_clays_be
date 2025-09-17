const httpStatus = require("http-status");
const { MarketPlace } = require("../../models");
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

const editMarket = async (reqBody) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { link } = reqBody;
    let market = await MarketPlace.findOne().session(session);

    if (!market) {
      [market] = await MarketPlace.create([{ link }], { session });
    }

    if (link) market.link = link;

    await market.save({ session });

    await session.commitTransaction();
    session.endSession();

    return { market };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Unable to edit store link. Please try again later."
    );
  }
};

module.exports = {
  getMarket,
  editMarket,
};
