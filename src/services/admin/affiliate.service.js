const httpStatus = require('http-status');
const { Affiliate } = require('../../models');
const ApiError = require('../../utils/ApiError');
const mongoose = require('mongoose');

const getAffiliateById = async() => {
    const affiliate = await Affiliate.findOne({isDeleted:false});
    if(!affiliate){
        throw new ApiError(httpStatus.BAD_REQUEST, 'Affiliate links not found.');
    }
    return affiliate;
}

const getAffiliate = async()=>{
  return await getAffiliateById();
}

const editAffiliate = async (reqBody) => {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const { link } = reqBody;
      let affiliate = await Affiliate.findOne().session(session);
  
      if (!affiliate) {
        [affiliate] = await Affiliate.create([{ link }], { session });
      }
  
      if (link) affiliate.link = link;
  
      await affiliate.save({ session });
  
      await session.commitTransaction();
      session.endSession();
      
      return { affiliate };
  
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
  
      throw new ApiError(httpStatus.BAD_REQUEST, 'Unable to edit affiliate link. Please try again later.');
    }
};

module.exports = {
    getAffiliate,
    editAffiliate,
}