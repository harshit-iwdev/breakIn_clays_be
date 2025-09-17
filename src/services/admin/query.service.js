const httpStatus = require('http-status');
const { Query } = require('../../models');
const { QUERY_TYPE } = require('../../config/config');

const listQuery = async(reqBody)=>{
    
    const {page=1,limit=10,type,search,sortKey="queryNo",sortOrder=1} = reqBody;

    let sortObject = {};

    sortObject[sortKey] = sortOrder;

    let filter = {isDeleted:false};

    if(type){
        filter.type = type;
    }

    if(search){
      filter.$or = [
        { subject: { $regex: `.*${search.toLowerCase()}.*`, $options: 'i' } },
        { query: { $regex: `.*${search.toLowerCase()}.*`, $options: 'i' } },
        { queryNo: { $regex: `.*${search.toLowerCase()}.*`, $options: 'i' } },
      ];
    }

    let pipeline = [
        {
            $match:filter
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
            pipeline:[
              {
                $project:{
                  _id:1,
                  name:1,
                  userName:1
                }
              }
            ]
          },
        },
        {
          $unwind: {
            path: '$user',
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

    let query = await Query.aggregate(pipeline);
    query = query[0];
    let totalRecords = query.totalRecords;

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
            results:query.results,
            page:page,
            totalPages:Math.ceil(totalRecords / limit)
        };
    }

    return data;
}

const deleteQuery = async(queryId)=>{
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const query = await Query.findOne({_id:queryId,isDeleted:false}).session(session);
  
      if(!query){
          await session.abortTransaction();
          session.endSession();
          throw new ApiError(httpStatus.BAD_REQUEST, 'No query found.');
        }
  
      query.isDeleted = true;
      await spqueryonsor.save({ session });
  
      await session.commitTransaction();
      session.endSession();
  
      return query;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
  
      throw error;
    }
  }

  const getTypes = async()=>{
    return QUERY_TYPE;
  }

module.exports = {
    listQuery,
    deleteQuery,
    getTypes,
}