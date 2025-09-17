const httpStatus = require('http-status');
const { GunSafe, GunRequest, GunDetail, Score } = require('../../models');
const ApiError = require('../../utils/ApiError');
const mongoose = require('mongoose');
const { CONDITIONAL_GUN_PART } = require('../../config/config');

const getGunById = async(id)=>{
    const gunSafe = await GunSafe.findOne({_id:id,isDeleted:false});
    if(!gunSafe){
        throw new ApiError(httpStatus.BAD_REQUEST, 'Gun not found.');
    }
    return gunSafe;
}

const getGun = async(gunId,user)=>{
  const {isMetric} = user;
  const gunSafe = await getGunById(gunId);
  let formattedGun = JSON.parse(JSON.stringify(gunSafe));
  if(gunSafe.status=="PENDING"){
    const gunRequest = await GunRequest.findOne({gunSafeId:gunSafe._id});
    if(gunRequest) {
      formattedGun.requestFields = gunRequest.requestFields;
    }
  }
  if(isMetric){
    let valueArr = [formattedGun.comb, formattedGun.barrel, formattedGun.pullLength];
    const existingPart = await GunDetail.find({ type: CONDITIONAL_GUN_PART,value:valueArr, isDeleted: false });
    formattedGun.comb = existingPart.find(part => part.type === "COMB")?.metricValue || formattedGun.comb;
    formattedGun.barrel = existingPart.find(part => part.type === "BARREL")?.metricValue || formattedGun.barrel;
    formattedGun.pullLength = existingPart.find(part => part.type === "PULL_LENGTH")?.metricValue || formattedGun.pullLength;
  }
  return formattedGun;
}

const createGun = async (gunSafeBody,user) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try{
    const { name, gauge, comb, barrel, actionType, rib, pullLength, chokeType, chokeMaterial, ChokeSize, brand, model, ChokeSize2 } = gunSafeBody;

    const userId = user._id;

    const parts = [
        { type: "GAUGE", value: gauge },
        { type: "COMB", value: comb },
        { type: "BARREL", value: barrel },
        { type: "ACTION_TYPE", value: actionType },
        { type: "RIB", value: rib },
        { type: "PULL_LENGTH", value: pullLength },
        { type: "CHOKE_TYPE", value: chokeType },
        { type: "CHOKE_MATERIAL", value: chokeMaterial },
        { type: "CHOKE_SIZE", value: ChokeSize },
      ];
      if(ChokeSize2){
        parts.push({ type: "CHOKE_SIZE", value: ChokeSize2 })
      }
    
      let isNewAdded = false;
      let gunStatus = "APPROVED";
      let newFields = [];

    for (const part of parts) {
      const existingPart = await GunDetail.findOne({ type: part.type, value: part.value, isDeleted: false }).session(session);
      
      if (!existingPart) {
          isNewAdded = true;
          gunStatus = "PENDING";
          newFields.push({ type: part.type, value: part.value});
      }
    }

    const [gunSafe] = await GunSafe.create([{ name, gauge, comb, barrel, actionType, rib, pullLength, chokeType, chokeMaterial, ChokeSize, brand, model, ChokeSize2, userId, status:gunStatus }], { session });
    
    if(isNewAdded){
      await GunRequest.create([{ requestFields:newFields,gunSafeId:gunSafe._id,userId,status:"PENDING" }], { session });
    }

    await session.commitTransaction();
    
    session.endSession();

    return { gunSafe: gunSafe };

  }catch(error){
    await session.abortTransaction();
    session.endSession();
    throw new ApiError(httpStatus.BAD_REQUEST, 'Unable to add gun. Please try again later.');
  }
}

const listGunSafe = async(reqBody,userId)=>{
  const {page=1,limit=10,status,search} = reqBody;

  let filter = {userId:new mongoose.Types.ObjectId(userId),isDeleted:false};

  if(status){
    filter.status = status;
  }else{
    filter.status = {$ne:"REJECTED"};
  }

  let pipeline = [
      {
          $match:filter
      },
      {
        $lookup: {  
          from: "gunrequests", 
          localField: "_id",
          foreignField: "gunSafeId",
          as: "gunRequest",
          pipeline:[
            {
              $match: {
                isDeleted: false
              }
            }
          ]
        }
      },
      {
        $unwind:{
          path: "$gunRequest",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project:{
                "_id": 1,
                "name":1,
                "userId":1,
                "gauge":1,
                "comb":1,
                "barrel":1,
                "actionType":1,
                "rib":1,
                "pullLength":1,
                "chokeType":1,
                "ChokeSize2":1,
                "chokeMaterial":1,
                "ChokeSize":1,
                "brand":1,
                "status":1,
                "model":1,
                "isDeleted":1,
                "createdAt":1,
                "updatedAt":1,
                "reason": "$gunRequest.reason",
                "requestFields": "$gunRequest.requestFields"
        }
      },
      {
        $sort: { createdAt: -1 }
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

  const [gunSafe] = await GunSafe.aggregate(pipeline);
  let data = {
      totalRecords:0,
      result:[],
      page:page,
      totalPages:0,
  };
  if(gunSafe.totalRecords < 1){
      return data;
  }else{
      data = {
          totalRecords:gunSafe.totalRecords,
          results:gunSafe.results,
          page:page,
          totalPages:Math.ceil(gunSafe.totalRecords / limit)
      };
  }

  return data;

}

const listGunPart = async(reqBody,user)=>{
  const {search} = reqBody;
  let {isMetric} = user;
  let filter = {isDeleted:false};
  if(!isMetric){
    isMetric = false;
  }
  if(search){
    filter.value = { $regex: `.*${search.toLowerCase()}.*`, $options: 'i' };
  }

  let pipeline = [
      {
          $match:filter
      },
      {
        $sort:{value:1}
      },
      {
        $group:{
          _id:"$type",
          values: {
            $push: {
              value: "$value",
              displayValue: {
                $cond: {
                  if: {
                    $and: [
                      { $in: ["$type", CONDITIONAL_GUN_PART] },
                      { $eq: [isMetric, true] }
                    ]
                   },
                  then: { $ifNull: ["$metricValue", "$value"] },
                  else: "$value"
                }
              }
            }
          }
        }
      },
      {
        $project:{
          _id:0,
          type:"$_id",
          values:1
        }
      }
  ];

  const gunDetail = await GunDetail.aggregate(pipeline);
    
  let transformedResults = gunDetail.reduce((acc, item) => {
    acc[item.type] = item.values;
    return acc;
  }, {});

  let data = {
    result:transformedResults,
  };

  return data;

}

const editGun = async(gunSafeBody)=>{
  const session = await mongoose.startSession();
  session.startTransaction();
  try{
    const { gunId, name, gauge, comb, barrel, actionType, rib, pullLength, chokeType, chokeMaterial, ChokeSize, brand, model, ChokeSize2 } = gunSafeBody;

    const gunSafe = await GunSafe.findOne({_id:gunId,isDeleted:false}).session(session);
    if(!gunSafe){
      throw new ApiError(httpStatus.BAD_REQUEST, 'Gun not found.');
    }
    if(gunSafe.status == "PENDING"){
      throw new ApiError(httpStatus.BAD_REQUEST, 'Gun under review cannot be edited.');
    }
    const userId = gunSafe.userId;

    const parts = [
        { type: "GAUGE", value: gauge },
        { type: "COMB", value: comb },
        { type: "BARREL", value: barrel },
        { type: "ACTION_TYPE", value: actionType },
        { type: "RIB", value: rib },
        { type: "PULL_LENGTH", value: pullLength },
        { type: "CHOKE_TYPE", value: chokeType },
        { type: "CHOKE_MATERIAL", value: chokeMaterial },
        { type: "CHOKE_SIZE", value: ChokeSize },
      ];
    
      if(ChokeSize2){
        parts.push({ type: "CHOKE_SIZE", value: ChokeSize2 })
      }
      let isNewAdded = false;
      let gunStatus = gunSafe.status;
      let newFields = [];

      for (const part of parts) {
        const existingPart = await GunDetail.findOne({ type: part.type, value: part.value, isDeleted: false }).session(session);
        
        if (!existingPart) {
            isNewAdded = true;
            gunStatus = "PENDING";
            newFields.push({ type: part.type, value: part.value});
        }
      }

    if(isNewAdded){
      const existingRequest = await GunRequest.findOne({ gunSafeId: gunSafe._id, isDeleted: false }).session(session);
      if (existingRequest) {
        await GunRequest.updateOne(
          { gunSafeId: gunSafe._id, isDeleted: false },
          { $set: { requestFields: newFields, status: "PENDING" } },
          { session }
        );
      } else {
        await GunRequest.create([{ requestFields:newFields,gunSafeId:gunSafe._id,userId,status:"PENDING" }], { session });
      }
    }

    if(isNewAdded == false && gunSafe.status == "REJECTED"){
        gunStatus = "APPROVED";
    }

    if(gunStatus == "APPROVED"){
      await GunRequest.updateMany(
        { gunSafeId: gunSafe._id },
        { $set: { isDeleted: true } },
        { session }
      );
    }

    if (name) gunSafe.name = name;
    if (model) gunSafe.model = model;
    if (brand) gunSafe.brand = brand;
    if (gauge) gunSafe.gauge = gauge;
    if (comb) gunSafe.comb = comb;
    if (barrel) gunSafe.barrel = barrel;
    if (actionType) gunSafe.actionType = actionType;
    if (rib) gunSafe.rib = rib;
    if (pullLength) gunSafe.pullLength = pullLength;
    if (chokeType) gunSafe.chokeType = chokeType;
    if (chokeMaterial) gunSafe.chokeMaterial = chokeMaterial;
    if (ChokeSize) gunSafe.ChokeSize = ChokeSize;
    if (ChokeSize2) gunSafe.ChokeSize2 = ChokeSize2;
    gunSafe.status = gunStatus;

    await gunSafe.save({ session });

    await session.commitTransaction();
    
    session.endSession();

    return { gunSafe: gunSafe };

  }catch(error){
    await session.abortTransaction();
    session.endSession();
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.BAD_REQUEST, 'Unable to edit gun. Please try again later.');
  }

}

const deleteGun = async (gunId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try{
    const gunSafe = await GunSafe.findOne({_id:gunId,isDeleted:false}).session(session);
    if(!gunSafe){
      throw new ApiError(httpStatus.BAD_REQUEST, 'Gun not found.');
    }
    if(gunSafe.status == "PENDING"){
      throw new ApiError(httpStatus.BAD_REQUEST, 'Gun under review cannot delete.');
    }

    const score = await Score.findOne({gunId:gunId,isDeleted:false}).session(session);
    if(score){
      throw new ApiError(httpStatus.BAD_REQUEST, 'Guns used for scoring cannot be deleted.');
    }
    gunSafe.isDeleted = true;

    await gunSafe.save({ session });

    await GunRequest.updateMany(
      { gunSafeId: gunSafe._id },
      { $set: { isDeleted: true } },
      { session }
    );

    await session.commitTransaction();

    session.endSession();

    return gunSafe;
    
  }catch(error){
    await session.abortTransaction();
    session.endSession();
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.BAD_REQUEST, 'Unable to delete gun. Please try again later.');
  }
}

module.exports = {
    createGun,
    getGun,
    listGunSafe,
    listGunPart,
    editGun,
    deleteGun,
}