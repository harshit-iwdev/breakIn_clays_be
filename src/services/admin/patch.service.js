const httpStatus = require('http-status');
const { Patch, Category } = require('../../models');
const ApiError = require('../../utils/ApiError');
const mongoose = require('mongoose');
const { createUrl } = require('../../utils/aws');
const AWSManager = require("../../utils/aws");

const getPatchById = async(id) => {
    const patch = await Patch.findOne({_id:id,isDeleted:false});
    if(!patch){
        throw new ApiError(httpStatus.BAD_REQUEST, 'Patch not found.');
    }
    return patch;
}

const createPatch = async (patchBody) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try{
    const { name, patchImage, categoryId, patchScore } = patchBody;

    const patchExist = await Patch.findOne({ categoryId:categoryId, patchScore:patchScore, isDeleted: false }).session(session);
  
    if (patchExist) {
      throw new ApiError(httpStatus.CONFLICT, 'A Patch with same category and score already exist.');
    }

    const [patch] = await Patch.create([{ name, patchScore, categoryId }], { session });

    if(patchImage){
        const signedImage = await createUrl(patchImage,AWSManager.patchFolderPath);
        patch.patchImage = signedImage;
        patch.patchImageName = patchImage;
    }

    await patch.save({ session });
    
    await session.commitTransaction();
    
    session.endSession();

    return { patch: patch[0] };

  }catch(error){
    await session.abortTransaction();
    session.endSession();
    if (error instanceof ApiError) {
        throw error;
    }  
    throw new ApiError(httpStatus.BAD_REQUEST, 'Unable to create patch. Please try again later.');
  }
}

const listPatch = async(reqBody)=>{
    const {page=1,limit=10,search,categoryId} = reqBody;

    let filter = {isDeleted:false};

    if(categoryId){
        filter.categoryId = new mongoose.Types.ObjectId(categoryId)
    }
    if(search){
      filter.$or = [
          { name: { $regex: `.*${search.toLowerCase()}.*`, $options: 'i' } },
        ];
    }
    let pipeline = [
        {
            $match:filter
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category',
          },
        },
        {
          $unwind: {
            path: '$category',
            preserveNullAndEmptyArrays: true,
          },
        },
        {$sort:{patchScore:1}},
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

    let patch = await Patch.aggregate(pipeline);
    patch = patch[0];
    let totalRecords = patch.totalRecords;

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
            results:patch.results,
            page:page,
            totalPages:Math.ceil(totalRecords / limit)
        };
    }

    return data;
}

const getPatch = async(patchId)=>{
  const patch = await getPatchById(patchId);
  const category = await Category.findById(patch.categoryId);
  let formattedPatch = JSON.parse(JSON.stringify(patch));
  formattedPatch.category = category;
  return formattedPatch;
}

const editPatch = async (patchBody) => {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const { patchId, name, startDate, endDate, tagLine, patchImage, categoryId, patchScore } = patchBody;
      
      const patchExist = await Patch.findOne({ _id: {$ne:patchId}, categoryId:categoryId, patchScore:patchScore, isDeleted: false }).session(session);
  
      if (patchExist) {
        throw new ApiError(httpStatus.CONFLICT, 'A Patch with same category and score already exist.');
      }

      const patch = await Patch.findOne({ _id: patchId, isDeleted: false }).session(session);
  
      if (!patch) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Patch not found.');
      }
  
      if (name) patch.name = name;
      if (patchScore) patch.patchScore = patchScore;
      if (startDate) patch.startDate = startDate;
      if (endDate) patch.endDate = endDate;
      if (tagLine) patch.tagLine = tagLine;
      if (categoryId) patch.categoryId = categoryId;
  
      
    if(patchImage){
      if(patch.patchImageName != patchImage){
        let deleteFile = patch.patchImage?patch.patchImageName:"";
        const signedImage = await createUrl(patchImage,AWSManager.patchFolderPath);
        patch.patchImage = signedImage;
        patch.patchImageName = patchImage;
        if(deleteFile){
          await AWSManager.deleteObject(deleteFile,AWSManager.patchFolderPath);
        }
      }
    }
    

    await patch.save({ session });
  
    await session.commitTransaction();
    session.endSession();

    return { patch };
  
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(httpStatus.BAD_REQUEST, 'Unable to edit patch. Please try again later.');
    }
  };

  const deletePatch = async(patchId)=>{
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const patch = await Patch.findOne({_id:patchId,isDeleted:false}).session(session);
  
      if(!patch){
          await session.abortTransaction();
          session.endSession();
          throw new ApiError(httpStatus.BAD_REQUEST, 'No patch found.');
        }
  
        patch.isDeleted = true;
      await patch.save({ session });
  
      await session.commitTransaction();
      session.endSession();
  
      return patch;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
  
      throw error;
    }
  }

module.exports = {
    createPatch,
    getPatch,
    listPatch,
    editPatch,
    deletePatch,
}