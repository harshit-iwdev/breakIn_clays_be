const mongoose = require("mongoose");
const { Score, GunDetail, AnalysisRecord } = require("../../models");
const ApiError = require("../../utils/ApiError");
const httpStatus = require("http-status");
const { pdfGenerator, pdfAnalysisGenerator } = require("../../utils/pdfUtils");
const { CONDITIONAL_GUN_PART } = require("../../config/config");

const getAnalysis = async (reqBody, user) => {
  const { categoryId, startDate, endDate, gunId, location, eventType } =
    reqBody;
  const { _id, isMetric } = user;
  let userId = _id;
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Invalid date format");
  }

  if (start > end) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "startDate cannot be greater than endDate"
    );
  }

  let filter = {
    categoryId: new mongoose.Types.ObjectId(categoryId),
    userId: new mongoose.Types.ObjectId(userId),
    scoreDate: {
      $gte: start,
      $lte: end,
    },
    isDeleted: false,
    isDraft: false,
  };

  if (eventType) {
    filter.eventType = eventType;
  }
  if (location) {
    filter.location = location;
  }
  if (gunId) {
    filter.gunId = new mongoose.Types.ObjectId(gunId);
  }
  let pipeline = [
    {
      $match: filter,
    },

    {
      $lookup: {
        from: "categories",
        localField: "categoryId",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $unwind: {
        path: "$category",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "scorerounds",
        localField: "roundIds",
        foreignField: "_id",
        as: "roundDetails",
        pipeline: [
          {
            $match: { isDeleted: false },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "scoreposts",
        localField: "_id",
        foreignField: "scoreId",
        as: "posts",
        pipeline: [
          {
            $match: { isDeleted: false },
          },
          {
            $project: {
              _id: 1,
              post: 1,
              postName: 1,
              postScore: 1,
              postShots: 1,
              createdAt: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "gunsaves",
        localField: "gunId",
        foreignField: "_id",
        as: "guns",
      },
    },
    {
      $unwind: {
        path: "$guns",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $facet: {
        generalStats: [
          {
            $group: {
              _id: null,
              scoreIds: { $push: "$_id" },
              highestScore: { $max: "$totalScore" },
              averageScore: { $avg: "$totalScore" },
              totalScore: { $sum: { $toInt: "$totalScore" } },
              totalShots: { $sum: { $toInt: "$totalShots" } },
              rounds: { $push: "$roundDetails" },
              posts: { $push: "$posts" },
              allScores: { $push: "$$ROOT" },
              category: { $first: "$category" },
            },
          },
          {
            $unset: "allScores",
          },
          {
            $addFields: {
              rounds: {
                $reduce: {
                  input: "$rounds",
                  initialValue: [],
                  in: { $concatArrays: ["$$value", "$$this"] },
                },
              },
            },
          },
          {
            $addFields: {
              posts: {
                $reduce: {
                  input: "$posts",
                  initialValue: [],
                  in: { $concatArrays: ["$$value", "$$this"] },
                },
              },
            },
          },
          {
            $addFields: {
              highestRoundShots: {
                $getField: {
                  field: "roundShots",
                  input: {
                    $arrayElemAt: [
                      {
                        $sortArray: {
                          input: "$rounds",
                          sortBy: { roundShots: -1 },
                        },
                      },
                      0,
                    ],
                  },
                },
              },
              highestRoundScore: { $max: "$rounds.roundScore" },
              averageRoundScore: { $avg: "$rounds.roundScore" },
            },
          },
          {
            $addFields: {
              highestPostScore: { $max: "$posts.postScore" },
            },
          },
          {
            $addFields: {
              totalShotsMissed: { $subtract: ["$totalShots", "$totalScore"] },
              missedPercentage: {
                $cond: {
                  if: { $eq: ["$totalShots", 0] },
                  then: 0,
                  else: {
                    $multiply: [
                      {
                        $divide: [
                          { $subtract: ["$totalShots", "$totalScore"] },
                          "$totalShots",
                        ],
                      },
                      100,
                    ],
                  },
                },
              },
            },
          },
          {
            $addFields: {
              hitPercentage: { $subtract: [100, "$missedPercentage"] },
            },
          },
          {
            $addFields: {
              averageScorePercentage: {
                $cond: [
                  { $eq: ["$totalShots", 0] },
                  0,
                  {
                    $round: [
                      {
                        $min: [
                          {
                            $multiply: [
                              { $divide: ["$totalScore", "$totalShots"] },
                              100,
                            ],
                          },
                          100,
                        ],
                      },
                      2,
                    ],
                  },
                ],
              },
            },
          },
        ],
        averageRoundScoresByRound: [
          {
            $unwind: "$roundDetails",
          },
          {
            $group: {
              _id: "$roundDetails.roundNo",
              totalRoundScore: { $sum: "$roundDetails.roundScore" },
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              roundNo: "$_id",
              averageScore: {
                $divide: ["$totalRoundScore", "$count"],
              },
            },
          },
          {
            $sort: { roundNo: 1 },
          },
        ],
        averageRoundHitPercentByRound: [
          {
            $unwind: "$roundDetails",
          },
          {
            $group: {
              _id: "$roundDetails.roundNo",
              totalRoundScore: { $sum: "$roundDetails.roundScore" },
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              roundNo: "$_id",
              averageScore: {
                $multiply: [
                  {
                    $divide: [
                      "$totalRoundScore",
                      { $multiply: [25, "$count"] },
                    ],
                  },
                  100,
                ],
              },
            },
          },
          {
            $sort: { roundNo: 1 },
          },
        ],
        averagePostScoresByPost: [
          {
            $unwind: "$posts",
          },
          {
            $group: {
              _id: "$posts.post",
              totalPostScore: { $sum: "$posts.postScore" },
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              post: "$_id",
              averageScore: { $divide: ["$totalPostScore", "$count"] },
            },
          },
          {
            $sort: { post: 1 },
          },
        ],
        averagePostHitPercentByPost: [
          { $unwind: "$posts" },
          {
            $group: {
              _id: "$posts.post",
              totalPostScore: { $sum: "$posts.postScore" },
              totalShots: { $sum: "$posts.postShots" },
            },
          },
          {
            $project: {
              _id: 0,
              post: "$_id",
              totalPostScore: 1,
              totalShots: 1,
              averageScore: {
                $cond: [
                  { $eq: ["$totalShots", 0] },
                  0,
                  {
                    $min: [
                      {
                        $round: [
                          {
                            $multiply: [
                              { $divide: ["$totalPostScore", "$totalShots"] },
                              100,
                            ],
                          },
                          2,
                        ],
                      },
                      100,
                    ],
                  },
                ],
              },
            },
          },
          { $sort: { post: 1 } },
          {
            $group: {
              _id: null,
              postAverages: {
                $push: { post: "$post", averageScore: "$averageScore" },
              },
              totalScoreAll: { $sum: "$totalPostScore" },
              totalShotsAll: { $sum: "$totalShots" },
              overallAveragePercent: { $avg: "$averageScore" },
            },
          },
          {
            $project: {
              _id: 0,
              postAverages: 1,
              overallAveragePercent: { $round: ["$overallAveragePercent", 1] },
              weightedAveragePercent: {
                $cond: [
                  { $eq: ["$totalShotsAll", 0] },
                  0,
                  {
                    $round: [
                      {
                        $min: [
                          {
                            $multiply: [
                              { $divide: ["$totalScoreAll", "$totalShotsAll"] },
                              100,
                            ],
                          },
                          100,
                        ],
                      },
                      1,
                    ],
                  },
                ],
              },
            },
          },
        ],
        highestRoundScoresByRound: [
          {
            $unwind: "$roundDetails",
          },
          {
            $sort: { "roundDetails.roundNo": 1, "roundDetails.roundScore": -1 },
          },
          {
            $group: {
              _id: "$roundDetails.roundNo",
              highestScore: { $max: "$roundDetails.roundScore" },
              scoreDate: { $first: "$roundDetails.createdAt" },
            },
          },
          {
            $project: {
              _id: 0,
              roundNo: "$_id",
              highestScore: 1,
              scoreDate: 1,
            },
          },
          { $sort: { roundNo: 1 } },
        ],
        highestHitPercentByRound: [
          {
            $unwind: "$roundDetails",
          },
          {
            $addFields: {
              "roundDetails.hitPercentage": {
                $cond: [
                  { $eq: ["$roundDetails.roundShots", 0] },
                  0,
                  {
                    $multiply: [
                      {
                        $divide: [
                          "$roundDetails.roundScore",
                          "$roundDetails.roundShots",
                        ],
                      },
                      100,
                    ],
                  },
                ],
              },
            },
          },
          {
            $sort: {
              "roundDetails.roundNo": 1,
              "roundDetails.hitPercentage": -1,
            },
          },
          {
            $group: {
              _id: "$roundDetails.roundNo",
              highestScore: { $first: "$roundDetails.hitPercentage" },
              scoreDate: { $first: "$roundDetails.createdAt" },
            },
          },
          {
            $project: {
              _id: 0,
              roundNo: "$_id",
              highestScore: 1,
              scoreDate: 1,
            },
          },
          {
            $sort: { roundNo: 1 },
          },
        ],
        highestPostScoresByPost: [
          {
            $unwind: "$posts",
          },
          { $sort: { "posts.post": 1, "posts.postScore": -1 } },
          {
            $group: {
              _id: "$posts.post",
              highestScore: { $max: "$posts.postScore" },
            },
          },
          {
            $project: {
              _id: 0,
              post: "$_id",
              highestScore: 1,
            },
          },
          { $sort: { post: 1 } },
        ],
        highestPostHitPercentByPost: [
          {
            $unwind: "$posts",
          },
          {
            $group: {
              _id: "$posts.post",
              highestScore: { $max: "$posts.postScore" },
              maxShots: { $max: "$posts.postShots" },
            },
          },
          {
            $project: {
              _id: 0,
              post: "$_id",
              highestScore: {
                $multiply: [{ $divide: ["$highestScore", "$maxShots"] }, 100],
              },
            },
          },
          {
            $sort: { post: 1 },
          },
        ],
        topHitPercentageRoundWithGun: [
          { $unwind: "$roundDetails" },
          {
            $addFields: {
              hitPercentage: {
                $cond: {
                  if: { $gt: ["$roundDetails.roundShots", 0] },
                  then: {
                    $multiply: [
                      {
                        $divide: [
                          "$roundDetails.roundScore",
                          "$roundDetails.roundShots",
                        ],
                      },
                      100,
                    ],
                  },
                  else: 0,
                },
              },
            },
          },
          {
            $sort: {
              "roundDetails.roundNo": 1,
              hitPercentage: -1,
            },
          },
          {
            $group: {
              _id: "$roundDetails.roundNo",
              topHitPercentage: { $first: "$hitPercentage" },
              scoreDate: { $first: "$roundDetails.createdAt" },
              gun: { $first: "$guns" },
              roundScore: { $first: "$roundDetails.roundScore" },
              roundShots: { $first: "$roundDetails.roundShots" },
            },
          },
          {
            $project: {
              _id: 0,
              roundNo: "$_id",
              hitPercentage: {
                $concat: [
                  {
                    $toString: {
                      $round: ["$topHitPercentage", 2],
                    },
                  },
                  " %",
                ],
              },
              scoreDate: 1,
              roundScore: 1,
              roundShots: 1,
              gun: {
                _id: "$gun._id",
                name: "$gun.name",
                model: "$gun.model",
                chokeSize: "$gun.ChokeSize",
              },
            },
          },
          { $sort: { roundNo: 1 } },
        ],
        highestScoreByGun: [
          {
            $match: {
              gunId: { $ne: null },
            },
          },
          {
            $addFields: {
              hitPercentage: {
                $cond: [
                  { $gt: ["$totalShots", 0] },
                  {
                    $multiply: [
                      { $divide: ["$totalScore", "$totalShots"] },
                      100,
                    ],
                  },
                  0,
                ],
              },
            },
          },
          {
            $sort: { hitPercentage: -1 },
          },
          {
            $group: {
              _id: "$guns._id",
              name: { $first: "$guns.name" },
              chokeSize: { $first: "$guns.ChokeSize" },
              model: { $first: "$guns.model" },
              highestScore: { $first: "$hitPercentage" },
            },
          },
          {
            $sort: { highestScorePercentage: -1 },
          },
        ],
        averageScoreByGun: [
          {
            $match: {
              gunId: { $ne: null },
            },
          },
          {
            $group: {
              _id: "$guns._id",
              name: { $first: "$guns.name" },
              chokeSize: { $first: "$guns.ChokeSize" },
              model: { $first: "$guns.model" },
              averageScore: { $avg: "$totalScore" },
              averageShots: { $avg: "$totalShots" },
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              chokeSize: 1,
              model: 1,
              averageScore: {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$averageScore", "$averageShots"] },
                      100,
                    ],
                  },
                  2, // Number of decimal places
                ],
              },
            },
          },
          {
            $sort: { averageScore: -1 },
          },
        ],
        scoresByNoOfRounds: [
          {
            $addFields: {
              totalScore: { $sum: "$roundDetails.roundScore" },
            },
          },
          {
            $group: {
              _id: "$noOfRounds",
              highestScore: { $max: "$totalScore" },
              averageScore: { $avg: "$totalScore" },
            },
          },
          {
            $project: {
              _id: 0,
              noOfRounds: "$_id",
              highestScore: { $round: ["$highestScore", 2] },
              averageScore: { $round: ["$averageScore", 2] },
            },
          },
          { $sort: { noOfRounds: 1 } },
        ],
        top5ScorePercent: [
          {
            $addFields: {
              scorePercentage: {
                $multiply: [
                  {
                    $divide: [
                      { $toDouble: "$totalScore" },
                      {
                        $cond: [
                          { $eq: [{ $toDouble: "$totalShots" }, 0] },
                          1,
                          { $toDouble: "$totalShots" },
                        ],
                      },
                    ],
                  },
                  100,
                ],
              },
            },
          },
          { $sort: { scorePercentage: -1 } },
          { $limit: 5 },
          {
            $project: {
              _id: 0,
              scoreId: "$_id",
              totalScore: 1,
              totalShots: 1,
              scorePercentage: { $round: ["$scorePercentage", 2] },
            },
          },
        ],
      },
    },
    {
      $project: {
        generalStats: { $arrayElemAt: ["$generalStats", 0] },
        averageRoundScoresByRound: 1,
        averageRoundHitPercentByRound: 1,
        averagePostScoresByPost: 1,
        averagePostHitPercentByPost: 1,
        highestRoundScoresByRound: 1,
        highestHitPercentByRound: 1,
        highestPostScoresByPost: 1,
        highestPostHitPercentByPost: 1,
        topHitPercentageRoundWithGun: 1,
        averageScoreByGun: 1,
        highestScoreByGun: 1,
        scoresByNoOfRounds: 1,
        top5ScorePercent: 1,
      },
    },
    {
      $project: {
        scoreIds: "$generalStats.scoreIds",
        category: "$generalStats.category",
        highestScore: "$generalStats.highestScore",
        averageScore: "$generalStats.averageScore",
        totalScore: "$generalStats.totalScore",
        totalShots: "$generalStats.totalShots",
        highestRoundShots: "$generalStats.highestRoundShots",
        highestRoundScore: "$generalStats.highestRoundScore",
        averagePostScore: "$generalStats.averagePostScore",
        highestPostScore: "$generalStats.highestPostScore",
        averageRoundScore: "$generalStats.averageRoundScore",
        totalShotsMissed: "$generalStats.totalShotsMissed",
        missedPercentage: "$generalStats.missedPercentage",
        hitPercentage: "$generalStats.hitPercentage",
        averageScorePercentage: "$generalStats.averageScorePercentage",
        averageRoundScoresByRound: 1,
        averageRoundHitPercentByRound: 1,
        averagePostScoresByPost: 1,
        averagePostHitPercentByPost: {
          $arrayElemAt: ["$averagePostHitPercentByPost.postAverages", 0],
        },
        highestRoundScoresByRound: 1,
        highestHitPercentByRound: 1,
        highestPostScoresByPost: 1,
        highestPostHitPercentByPost: 1,
        topHitPercentageRoundWithGun: 1,
        averageScoreByGun: 1,
        highestScoreByGun: 1,
        scoresByNoOfRounds: 1,
        top5ScorePercent: 1,
        averageStationScorePercentage: {
          $arrayElemAt: [
            "$averagePostHitPercentByPost.overallAveragePercent",
            0,
          ],
        },
      },
    },
  ];

  const scoreData = await Score.aggregate(pipeline);
  let result = scoreData[0];
  if (isMetric && result.gun) {
    let valueArr = [result.gun.comb, result.gun.barrel, result.gun.pullLength];
    const existingPart = await GunDetail.find({
      type: CONDITIONAL_GUN_PART,
      value: valueArr,
      isDeleted: false,
    });
    result.gun.comb =
      existingPart.find((part) => part.type === "COMB")?.metricValue ||
      result.gun.comb;
    result.gun.barrel =
      existingPart.find((part) => part.type === "BARREL")?.metricValue ||
      result.gun.barrel;
    result.gun.pullLength =
      existingPart.find((part) => part.type === "PULL_LENGTH")?.metricValue ||
      result.gun.pullLength;
  }

  const isRecordExist = await AnalysisRecord.findOne({
    userId: userId,
    categoryId: categoryId,
    isDeleted: false,
  });
  if (!isRecordExist) {
    await AnalysisRecord.create({
      userId: userId,
      categoryId: categoryId,
      recordDate: new Date(),
    });
  } else {
    isRecordExist.recordDate = new Date();
    await isRecordExist.save();
  }
  return result;
};

const getAnalysisGuns = async (reqBody, userId) => {
  const { categoryId, startDate, endDate, eventType } = reqBody;
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Invalid date format");
  }

  if (start > end) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "startDate cannot be greater than endDate"
    );
  }

  let filter = {
    categoryId: new mongoose.Types.ObjectId(categoryId),
    userId: new mongoose.Types.ObjectId(userId),
    scoreDate: {
      $gte: start,
      $lte: end,
    },
    isDeleted: false,
  };

  if (eventType) {
    filter.eventType = eventType;
  }

  let pipeline = [
    {
      $match: filter,
    },
    {
      $lookup: {
        from: "gunsaves",
        localField: "gunId",
        foreignField: "_id",
        as: "gun",
      },
    },
    {
      $unwind: {
        path: "$gun",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $group: {
        _id: "$gun._id",
        gunId: { $first: "$gun._id" },
        gunName: { $first: "$gun.name" },
        model: { $first: "$gun.model" },
        brand: { $first: "$gun.brand" },
        chokeSize: { $first: "$gun.ChokeSize" },
      },
    },
    {
      $sort: { _id: -1 },
    },
  ];

  const scoreData = await Score.aggregate(pipeline);

  return scoreData;
};

const getAnalysisLocation = async (reqBody, userId) => {
  const { categoryId, startDate, endDate, eventType } = reqBody;
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Invalid date format");
  }

  if (start > end) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "startDate cannot be greater than endDate"
    );
  }

  let filter = {
    categoryId: new mongoose.Types.ObjectId(categoryId),
    userId: new mongoose.Types.ObjectId(userId),
    scoreDate: {
      $gte: start,
      $lte: end,
    },
    isDeleted: false,
  };

  if (eventType) {
    filter.eventType = eventType;
  }

  let pipeline = [
    {
      $match: filter,
    },
    {
      $group: {
        _id: "$location",
      },
    },
  ];

  const scoreData = await Score.aggregate(pipeline);

  return scoreData;
};

const getAnalysisPDF = async (reqBody) => {
  const pdf = await pdfAnalysisGenerator(reqBody);
  return pdf;
};

module.exports = {
  getAnalysis,
  getAnalysisGuns,
  getAnalysisPDF,
  getAnalysisLocation,
};
