const { GunDetail } = require('../../models');
const mongoose = require("mongoose");
const ApiError = require('../../utils/ApiError');
const httpStatus = require('http-status');
const { GUN_PARTS, CONDITIONAL_GUN_PART } = require('../../config/config');


const getGunDetailById = async(id)=>{
    const gunDetail = await GunDetail.findOne({_id:id,isDeleted:false});
    if(!gunDetail){
        throw new ApiError(httpStatus.BAD_REQUEST, 'Gun detail not found.');
    }
    return gunDetail;
}

const getGunDetail = async(gunDetailId)=>{
  return await getGunDetailById(gunDetailId);
}

const createGunDetail = async (gunBody) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try{
    const { value,type,metricValue } = gunBody;
    let createBody = { value,type };
    if(CONDITIONAL_GUN_PART.includes(type)){
        createBody.metricValue = metricValue;
    }
    const isExist = await GunDetail.findOne({ type,value:value,isDeleted:false });
    if(isExist){
        throw new ApiError(httpStatus.BAD_REQUEST, 'The provided value already exists for this type. Please enter a different one.');
    }
    const gunDetail = await GunDetail.create([createBody], { session });

    await session.commitTransaction();
    
    session.endSession();

    return { gunDetail: gunDetail[0] };

  }catch(error){
    await session.abortTransaction();
    session.endSession();
    if (error instanceof ApiError) {
        throw error;
      }  
    throw new ApiError(httpStatus.BAD_REQUEST, 'Unable to add gun detail. Please try again later.');
  }
}

const editGunDetail = async (gunBody) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try{
    const { gunDetailId, value, metricValue, type} = gunBody;

    const gunDetail = await getGunDetailById(gunDetailId);
    if(!gunDetail){
      throw new ApiError(httpStatus.BAD_REQUEST, 'Gun detail not found.');
  }

  const isExist = await GunDetail.findOne({ _id:{$ne:gunDetailId},type,value:gunDetail.value,isDeleted:false });
  if(isExist){
      throw new ApiError(httpStatus.BAD_REQUEST, 'The provided value already exists for this type. Please enter a different one.');
  }

    if (value) gunDetail.value = value;

    if (metricValue) gunDetail.metricValue = metricValue;

    await gunDetail.save({ session });

    await session.commitTransaction();
    
    session.endSession();

    return gunDetail;

  }catch(error){
    console.log("🚀 ~ editGunDetail ~ error:", error)
    await session.abortTransaction();
    session.endSession();
    if (error instanceof ApiError) {
        throw error;
      }  
    throw new ApiError(httpStatus.BAD_REQUEST, 'Unable to edit gun detail. Please try again later.');
  }
}

const listGunDetail = async(reqBody)=>{
    const {page=1,limit=10,type,search} = reqBody;

    let filter = {type:type,isDeleted:false};
    if(search){
      filter.$or = [
          { value: { $regex: `.*${search.toLowerCase()}.*`, $options: 'i' } },
        ];
    }
    let pipeline = [
        {
            $match:filter
        },
        {
          $sort:{ value: 1 }
        },
        {
            $facet: {
              totalRecords: [
                { $count: "total" }
              ],
              results: [
                { $skip: (page - 1) * limit },
                { $limit: limit },
              ],
            },
        },
        {
            $addFields: {
                totalRecords: { $ifNull: [{ $arrayElemAt: ["$totalRecords.total", 0] }, 0] }
            }
        }
    ];

    let gunDetail = await GunDetail.aggregate(pipeline);
    gunDetail = gunDetail[0];
    let totalRecords = gunDetail.totalRecords;

    let data = {
        totalRecords:0,
        result:[],
        page:page,
        totalPages:0,
    };
    
    if(totalRecords < 1){
        return data;
    }else{
        data = {
            totalRecords:totalRecords,
            results:gunDetail.results,
            page:page,
            totalPages:Math.ceil(totalRecords / limit)
        };
    }

    return data;
}

const getGunTypes = async()=>{
  return {gunType:GUN_PARTS,metricType:CONDITIONAL_GUN_PART};
}

const deleteGunDetail = async(gunDetailId)=>{
    
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const gunDetail = await GunDetail.findOne({_id:gunDetailId,isDeleted:false}).session(session);

    if(!gunDetail){
        throw new ApiError(httpStatus.BAD_REQUEST, 'No gun detail found.');
      }

    gunDetail.isDeleted = true;
    await gunDetail.save({ session });

    await session.commitTransaction();
    session.endSession();

    return gunDetail;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    throw error;
  }
}

module.exports = {
    createGunDetail,
    listGunDetail,
    getGunDetail,
    getGunTypes,
    editGunDetail,
    deleteGunDetail,
}