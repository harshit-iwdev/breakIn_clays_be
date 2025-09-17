const httpStatus = require('http-status');
const { Sponsor, Category } = require('../../models');
const ApiError = require('../../utils/ApiError');
const mongoose = require('mongoose');
const { createUrl } = require('../../utils/aws');
const AWSManager = require("../../utils/aws");

const getSponsorById = async(id) => {
    const sponsor = await Sponsor.findOne({_id:id,isDeleted:false});
    if(!sponsor){
        throw new ApiError(httpStatus.BAD_REQUEST, 'Sponsor not found.');
    }
    return sponsor;
}

const createSponsor = async (sponsorBody) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try{
    const { name, startDate, endDate, tagLine, banner, categoryId } = sponsorBody;

    const [sponsor] = await Sponsor.create([{ name, startDate, endDate, tagLine, categoryId }], { session });

    if(banner){
        const signedImage = await createUrl(banner,AWSManager.sponsorFolderPath);
        sponsor.banner = signedImage;
        sponsor.bannerName = banner;
    }

    let currentDate = new Date();

    if(startDate <= currentDate  && endDate >= currentDate){
      sponsor.status = true;
    }

    await sponsor.save({ session });
    
    await session.commitTransaction();
    
    session.endSession();

    return { sponsor: sponsor[0] };

  }catch(error){
    await session.abortTransaction();
    session.endSession();
    throw new ApiError(httpStatus.BAD_REQUEST, 'Unable to create sponsor. Please try again later.');
  }
}

const listSponsor = async(reqBody)=>{
    const {page=1,limit=10,categoryId,search,sortKey="createdAt",sortOrder=-1} = reqBody;
    
    let sortObject = {};

    sortObject[sortKey] = sortOrder;
    
    let filter = {isDeleted:false};
    if(categoryId){
      filter.categoryId =new mongoose.Types.ObjectId(categoryId);
    }
    if(search){
      filter.$or = [
          { name: { $regex: `.*${search.toLowerCase()}.*`, $options: 'i' } },
          { tagLine: { $regex: `.*${search.toLowerCase()}.*`, $options: 'i' } },
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
        {$sort:sortObject},
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

    let sponsor = await Sponsor.aggregate(pipeline);
    sponsor = sponsor[0];
    let totalRecords = sponsor.totalRecords;

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
            results:sponsor.results,
            page:page,
            totalPages:Math.ceil(totalRecords / limit)
        };
    }

    return data;
}

const getSponsor = async(sponsorId)=>{
  const sponsor = await getSponsorById(sponsorId);
  const category = await Category.findById(sponsor.categoryId);
  let formattedSponsor = JSON.parse(JSON.stringify(sponsor));
  formattedSponsor.category = category;
  return formattedSponsor;
}

const editSponsor = async (sponsorBody) => {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const { sponsorId, name, startDate, endDate, tagLine, banner, categoryId } = sponsorBody;
      const sponsor = await Sponsor.findOne({ _id: sponsorId, isDeleted: false }).session(session);
  
      if (!sponsorId) {
        await session.abortTransaction();
        session.endSession();
        throw new ApiError(httpStatus.BAD_REQUEST, 'Sponsor not found.');
      }
  
      if (name) sponsor.name = name;
      if (startDate) sponsor.startDate = startDate;
      if (endDate) sponsor.endDate = endDate;
      if (tagLine) sponsor.tagLine = tagLine;
      if (categoryId) sponsor.categoryId = categoryId;
  
      await sponsor.save({ session });
      if(banner){
          console.log("🚀 ~ editSponsor ~ banner:", banner)
          let deleteFile = sponsor.banner?sponsor.bannerName:"";
          console.log("🚀 ~ editSponsor ~ deleteFile:", deleteFile)
          const signedImage = await createUrl(banner,AWSManager.sponsorFolderPath);
          sponsor.banner = signedImage;
          sponsor.bannerName = banner;
          if(deleteFile){
            await AWSManager.deleteObject(deleteFile,AWSManager.sponsorFolderPath);
          }
      }
    
      await sponsor.save({ session });
    
      await session.commitTransaction();
      session.endSession();
    

      return { sponsor };
  
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
  
      throw new ApiError(httpStatus.BAD_REQUEST, 'Unable to edit sponsor. Please try again later.');
    }
};

  const deleteSponsor = async(sponsorId)=>{
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const sponsor = await Sponsor.findOne({_id:sponsorId,isDeleted:false}).session(session);
  
      if(!sponsor){
          await session.abortTransaction();
          session.endSession();
          throw new ApiError(httpStatus.BAD_REQUEST, 'No sponsor found.');
        }
  
        sponsor.isDeleted = true;
      await sponsor.save({ session });
  
      await session.commitTransaction();
      session.endSession();
  
      return sponsor;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
  
      throw error;
    }
  }

module.exports = {
    createSponsor,
    getSponsor,
    listSponsor,
    editSponsor,
    deleteSponsor,
}