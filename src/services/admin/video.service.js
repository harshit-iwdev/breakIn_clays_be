const httpStatus = require('http-status');
const { Video, Category } = require('../../models');
const ApiError = require('../../utils/ApiError');
const mongoose = require('mongoose');

const getVideoById = async(id) => {
    const video = await Video.findOne({_id:id,isDeleted:false});
    if(!video){
        throw new ApiError(httpStatus.BAD_REQUEST, 'Video not found.');
    }
    return video;
}

const createVideo = async (videoBody) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try{
    const { title,link } = videoBody;

    const [video] = await Video.create([{ title,link }], { session });

    await session.commitTransaction();
    
    session.endSession();

    return { video: video };

  }catch(error){
    await session.abortTransaction();
    session.endSession();
    throw new ApiError(httpStatus.BAD_REQUEST, 'Unable to create video. Please try again later.');
  }
}

const listVideo = async(reqBody)=>{
    const {page=1,limit=10,search,sortBy="createdAt",sortOrder=-1} = reqBody;
    let sortValue={};
    sortValue[sortBy] = sortOrder;
    sortValue["_id"] = sortOrder;
    let filter = {isDeleted:false};
    if(search){
      filter.$or = [
          { title: { $regex: `.*${search.toLowerCase()}.*`, $options: 'i' } },
          { link: { $regex: `.*${search.toLowerCase()}.*`, $options: 'i' } },
        ];
    }
    let pipeline = [
        {
            $match:filter
        },
        {
            $facet: {
              totalRecords: [
                { $count: "total" }
              ],
              results: [
                { $skip: (page - 1) * limit },
                { $limit: limit },
                { $sort: sortValue }
              ],
            },
        },
        {
            $addFields: {
                totalRecords: { $ifNull: [{ $arrayElemAt: ["$totalRecords.total", 0] }, 0] }
            }
        }
    ];

    let video = await Video.aggregate(pipeline);
    video = video[0];
    let totalRecords = video.totalRecords;

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
            results:video.results,
            page:page,
            totalPages:Math.ceil(totalRecords / limit)
        };
    }

    return data;
}

const getVideo = async(videoId)=>{
  const video = await getVideoById(videoId);
  return video;
}

const editVideo = async (videoBody) => {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const { videoId, title, link } = videoBody;
      const video = await Video.findOne({ _id: videoId, isDeleted: false }).session(session);
  
      if (!videoId) {
        await session.abortTransaction();
        session.endSession();
        throw new ApiError(httpStatus.BAD_REQUEST, 'Video not found.');
      }
  
      if (title) video.title = title;
      if (link) video.link = link;
  
      await video.save({ session });
      await session.commitTransaction();
      session.endSession();
    

      return { video };
  
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
  
      throw new ApiError(httpStatus.BAD_REQUEST, 'Unable to edit video. Please try again later.');
    }
};

  const deleteVideo = async(videoId)=>{
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const video = await Video.findOne({_id:videoId,isDeleted:false}).session(session);
  
      if(!video){
          throw new ApiError(httpStatus.BAD_REQUEST, 'No video found.');
        }
  
      video.isDeleted = true;
      await video.save({ session });
  
      await session.commitTransaction();
      session.endSession();
  
      return video;
      
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
  
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(httpStatus.BAD_REQUEST, 'Unable to delete video. Please try again later.');
    }
  }

module.exports = {
    createVideo,
    getVideo,
    listVideo,
    editVideo,
    deleteVideo,
}