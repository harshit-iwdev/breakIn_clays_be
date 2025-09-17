const { Category } = require('../../models');
const mongoose = require("mongoose");
const ApiError = require('../../utils/ApiError');
const httpStatus = require('http-status');

const getCategoryById = async(id)=>{
    const category = await Category.findOne({_id:id,isDeleted:false});
    if(!category){
        throw new ApiError(httpStatus.BAD_REQUEST, 'Category not found.');
    }
    return category;
}

const listCategory = async(reqBody)=>{
    const {page=1,limit=10,search} = reqBody;

    let filter = {};

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
              ],
            },
        },
        {
            $addFields: {
                totalRecords: { $ifNull: [{ $arrayElemAt: ["$totalRecords.total", 0] }, 0] }
            }
        }
    ];

    let category = await Category.aggregate(pipeline);
    category = category[0];
    let totalRecords = category.totalRecords;
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
            results:category.results,
            page:page,
            totalPages:Math.ceil(totalRecords / limit)
        };
    }

    return data;
}

const createCategory = async (categoryBody) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try{

    const { name } = categoryBody;
    const category = await Category.create([{ name }], { session });

    await session.commitTransaction();
    
    session.endSession();

    return { category: category[0] };

  }catch(error){
    await session.abortTransaction();
    session.endSession();
    throw new ApiError(httpStatus.BAD_REQUEST, 'Unable to create category. Please try again later.');
  }
}

module.exports = {
    listCategory,
    createCategory,
    getCategoryById,
}