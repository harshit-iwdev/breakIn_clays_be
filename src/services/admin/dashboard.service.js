const { User, Score } = require('../../models');

const dashboardData = async(reqBody)=>{
    
    const {} = reqBody;

    let filter = {isDeleted:false,role:"user"};

    let pipeline = [
        {
            $match:filter
        },
        {
          $facet: {
            totalUsers: [
              { $count: "count" }
            ],
            premiumUsers: [
              { $match: { isPremium: true } },
              { $count: "count" }
            ]
          }
        },
        {
          $project: {
            totalUsers: { $arrayElemAt: ["$totalUsers.count", 0] },
            premiumUsers: { $arrayElemAt: ["$premiumUsers.count", 0] }
          }
        }
    ];

    let [userData] = await User.aggregate(pipeline);

    let scorePipeline = [
      {
        $match:{
          isDeleted:false
        }
      },
      {
        $group: {
          _id: null,
          score: { $sum: "$totalScore" }
        }
      }
    ];

    let [totalScore] = await Score.aggregate(scorePipeline);
    
    let data = {
        totalUsers:userData.totalUsers?userData.totalUsers:0,
        premiumUsers:userData.premiumUsers?userData.premiumUsers:0,
        totalScore:totalScore?totalScore.score:0
    };

    return data;
}

module.exports = {
    dashboardData
}