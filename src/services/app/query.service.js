const httpStatus = require('http-status');
const { Query } = require('../../models');
const { QUERY_TYPE } = require('../../config/config');
const QueryNo = `#${process.env.QUERY_NUMBER}`;

function incrementQU(code) {
    const match = code.match(/^(#?)([A-Z]+)(\d+)$/);
    if (!match) return null; // Return null for invalid formats

    const prefixSymbol = match[1]; // Extracts optional leading '#'
    const prefix = match[2]; // Extracts 'QU'
    const number = parseInt(match[3], 10); // Extracts and converts '00101' to a number

    const newNumber = (number + 1).toString().padStart(match[3].length, '0'); // Maintain digit length

    return prefixSymbol + prefix + newNumber;
}

const createQuery = async(reqBody,userId)=>{
    const {subject,query,type} = reqBody;
    let queryNo = "";
    const previousQueryNo = await Query.findOne().sort({queryNo:-1});

    if(previousQueryNo){
        queryNo = incrementQU(previousQueryNo.queryNo);
    }else{
        queryNo = incrementQU(QueryNo);
    }

    const queryObj = await Query.create({userId,subject,query,type,queryNo});

    return queryObj; 
     
}

module.exports = {
    createQuery,
}