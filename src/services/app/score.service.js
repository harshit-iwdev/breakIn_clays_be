const httpStatus = require("http-status");
const {
  Score,
  ScorePost,
  ScoreRound,
  GunSafe,
  Patch,
  UserPatch,
  Category,
} = require("../../models");
const ApiError = require("../../utils/ApiError");
const mongoose = require("mongoose");
const {
  CONDITIONAL_CATEGORY,
  ANALYSIS_CATEGORY,
} = require("../../config/config");
const { createUrl } = require("../../utils/aws");
const AWSManager = require("../../utils/aws");
const {
  pdfAnalysisGenerator,
  pdfScoreGenerator,
} = require("../../utils/pdfUtils");
const { pipeline } = require("nodemailer/lib/xoauth2");
const moment = require("moment");

async function assignPatch({
  categoryId,
  highestStreak,
  userId,
  scoreId,
  session,
}) {
  const patch = await Patch.findOne({
    isDeleted: false,
    categoryId: categoryId,
    patchScore: { $lte: highestStreak },
  })
    .sort({ patchScore: -1 })
    .session(session);

  if (patch) {
    await UserPatch.create([{ patchId: patch._id, userId, scoreId }], {
      session,
    });
  }
}

const getHighestStreak = async (rounds) => {
  let scoreCountFlag = false;
  let scoreStreak = 0;
  let isContinue = true;
  let highestStreak = 0;
  let roundStreakArr = [];

  for (const round of rounds) {
    const { roundNo, roundShots, roundScore } = round;

    if (roundShots == roundScore) {
      scoreStreak = scoreStreak + roundShots;
      highestStreak = scoreStreak;
      isContinue = true;
    } else {
      scoreStreak = 0;
      isContinue = false;
    }

    roundStreakArr.push({
      roundNo: roundNo,
      roundScore: roundScore,
      roundShots: roundShots,
      scoreStreak: scoreStreak,
      highestStreak: highestStreak,
      isContinue: isContinue,
      patch: false,
    });

    highestStreak = isContinue ? highestStreak : 0;
  }
  if (roundStreakArr.length > 0) {
    let counter = 0;
    for (roundObj of roundStreakArr) {
      const isLastRound = counter === roundStreakArr.length - 1;
      if (!roundObj.isContinue || isLastRound) {
        roundObj.patch = true;
      }
      counter = counter + 1;
    }
  }
};

function isTodayOrFuture(dateString) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const givenDate = new Date(dateString);
  givenDate.setHours(0, 0, 0, 0);

  return givenDate.getTime() >= today.getTime();
}

const createScore = async (reqBody, userId) => {
  const {
    location,
    latitude,
    longitude,
    scoreDate,
    categoryId,
    scoreImage,
    gunId,
    noOfRounds,
    handicap,
    rounds,
    eventType,
    totalScore,
    totalShots,
    eventId,
    isDraft,
  } = reqBody;

  if (!isTodayOrFuture(scoreDate)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Invalid date. Please select today or a future date."
    );
  }

  let roundIds = [];
  let scoreCountFlag = false;
  let scoreStreak = 0;
  let highestStreak = 0;
  let roundStreakArr = [];

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const categoryObj = await Category.findOne({ _id: categoryId }).session(
      session
    );
    const [scoreData] = await Score.create(
      [
        {
          location,
          latitude,
          longitude,
          scoreDate,
          categoryId,
          gunId,
          noOfRounds,
          eventType,
          handicap,
          userId,
          totalScore,
          totalShots,
          eventId,
          isDraft,
        },
      ],
      { session }
    );

    for (const round of rounds) {
      const { roundNo, roundShots, roundScore, posts, note } = round;
      let postIds = [];
      const [scoreRound] = await ScoreRound.create(
        [{ roundNo, roundShots, roundScore, scoreId: scoreData._id, note }],
        { session }
      );
      if (posts && posts.length > 0) {
        for (const postObj of posts) {
          const { post, postName, shots } = postObj;

          //for total shots and score
          const postShots = shots.length;
          const postScore = shots.reduce((sum, item) => sum + item.score, 0);

          const [scorePost] = await ScorePost.create(
            [
              {
                post,
                postName,
                shots,
                roundId: scoreRound._id,
                scoreId: scoreData._id,
                postScore: postScore,
                postShots: postShots,
              },
            ],
            { session }
          );
          postIds.push(scorePost._id);
        }
      }

      if (roundShots == roundScore) {
        scoreStreak = scoreStreak + roundShots;
        highestStreak = scoreStreak;
        isContinue = true;
      } else {
        scoreStreak = 0;
        isContinue = false;
      }

      roundStreakArr.push({
        roundNo: roundNo,
        roundScore: roundScore,
        roundShots: roundShots,
        scoreStreak: scoreStreak,
        highestStreak: highestStreak,
        isContinue: isContinue,
        patch: false,
      });

      highestStreak = isContinue ? highestStreak : 0;

      scoreRound.postIds = postIds;
      await scoreRound.save({ session });
      roundIds.push(scoreRound._id);
    }

    scoreData.roundIds = roundIds;

    if (scoreImage) {
      const signedImage = await createUrl(
        scoreImage,
        AWSManager.scoreFolderPath
      );
      scoreData.scoreImage = signedImage;
      scoreData.scoreImageName = scoreImage;
    }

    await scoreData.save({ session });

    if (ANALYSIS_CATEGORY.includes(categoryObj.name)) {
      if (roundStreakArr.length > 0) {
        let counter = 0;
        for (roundObj of roundStreakArr) {
          const isLastRound = counter === roundStreakArr.length - 1;
          if ((!roundObj.isContinue || isLastRound) && !isDraft) {
            await assignPatch({
              categoryId,
              highestStreak: roundObj.highestStreak,
              userId,
              scoreId: scoreData._id,
              session,
            });
          }
          counter = counter + 1;
        }
      }
    }

    await session.commitTransaction();

    session.endSession();

    return scoreData;
  } catch (error) {
    console.log("🚀 ~ createScore ~ error:", error);
    await session.abortTransaction();
    session.endSession();
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Unable to add score. Please try again later."
    );
  }
};

const editScore = async (reqBody, userId) => {
  const {
    _id: scoreId,
    location,
    latitude,
    longitude,
    scoreDate,
    categoryId,
    scoreImage,
    gunId,
    noOfRounds,
    handicap,
    rounds,
    eventType,
    totalScore,
    totalShots,
    eventId,
    isDraft,
  } = reqBody;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingScore = await Score.findOne({ _id: scoreId, userId }).session(
      session
    );
    if (!existingScore)
      throw new ApiError(httpStatus.NOT_FOUND, "Score not found");

    const categoryObj = await Category.findOne({ _id: categoryId }).session(
      session
    );

    const existingRounds = await ScoreRound.find({
      scoreId,
      isDeleted: { $ne: true },
    }).session(session);

    const existingPosts = await ScorePost.find({
      scoreId,
      isDeleted: { $ne: true },
    }).session(session);

    const existingRoundIds = existingRounds.map((r) => r._id.toString());
    const existingPostIds = existingPosts.map((p) => p._id.toString());

    let scoreStreak = 0;
    let highestStreak = 0;
    let roundStreakArr = [];
    let updatedRoundIds = [];
    const retainedRoundIds = [];
    const retainedPostIds = [];

    for (const round of rounds) {
      const {
        _id: roundId,
        roundNo,
        roundShots,
        roundScore,
        posts,
        note,
      } = round;

      let scoreRound;
      if (roundId) {
        scoreRound = await ScoreRound.findOne({
          _id: roundId,
          scoreId,
        }).session(session);
        if (!scoreRound)
          throw new ApiError(
            httpStatus.NOT_FOUND,
            `Round ${roundNo} not found`
          );
        scoreRound.set({
          roundNo,
          roundShots,
          roundScore,
          note,
          isDeleted: false,
        });
        await scoreRound.save({ session });
      } else {
        const [newRound] = await ScoreRound.create(
          [
            {
              roundNo,
              roundShots,
              roundScore,
              scoreId,
              note,
            },
          ],
          { session }
        );
        scoreRound = newRound;
      }

      retainedRoundIds.push(scoreRound._id.toString());
      updatedRoundIds.push(scoreRound._id);

      const postIds = [];

      for (const post of posts) {
        const { _id: postId, post: postNum, postName, shots } = post;
        const postShots = shots.length;
        const postScore = shots.reduce((sum, s) => sum + s.score, 0);

        let scorePost;
        if (postId) {
          scorePost = await ScorePost.findOne({
            _id: postId,
            roundId: scoreRound._id,
          }).session(session);
          if (!scorePost)
            throw new ApiError(
              httpStatus.NOT_FOUND,
              `Post not found for round ${roundNo}`
            );
          scorePost.set({
            post: postNum,
            postName,
            shots,
            postScore,
            postShots,
            isDeleted: false,
          });
          await scorePost.save({ session });
        } else {
          const [newPost] = await ScorePost.create(
            [
              {
                post: postNum,
                postName,
                shots,
                roundId: scoreRound._id,
                scoreId,
                postScore,
                postShots,
              },
            ],
            { session }
          );
          scorePost = newPost;
        }

        retainedPostIds.push(scorePost._id.toString());
        postIds.push(scorePost._id);
      }

      scoreRound.postIds = postIds;
      await scoreRound.save({ session });

      const isContinue = roundShots === roundScore;
      scoreStreak = isContinue ? scoreStreak + roundShots : 0;
      highestStreak = isContinue ? scoreStreak : 0;

      roundStreakArr.push({
        roundNo,
        roundScore,
        roundShots,
        scoreStreak,
        highestStreak,
        isContinue,
        patch: false,
      });
    }

    const roundsToSoftDelete = existingRoundIds.filter(
      (id) => !retainedRoundIds.includes(id)
    );
    const postsToSoftDelete = existingPostIds.filter(
      (id) => !retainedPostIds.includes(id)
    );

    if (roundsToSoftDelete.length > 0) {
      await ScoreRound.updateMany(
        { _id: { $in: roundsToSoftDelete } },
        { $set: { isDeleted: true } },
        { session }
      );
    }

    if (postsToSoftDelete.length > 0) {
      await ScorePost.updateMany(
        { _id: { $in: postsToSoftDelete } },
        { $set: { isDeleted: true } },
        { session }
      );
    }

    existingScore.set({
      location,
      latitude,
      longitude,
      scoreDate,
      categoryId,
      gunId,
      noOfRounds,
      handicap,
      eventType,
      totalScore,
      totalShots,
      eventId,
      roundIds: updatedRoundIds,
      isDraft,
    });
    if (scoreImage) {
      // Extract just the image filename from the full path
      const newImageName = scoreImage.split("/").pop(); // e.g., "new-image.png"

      if (newImageName !== existingScore.scoreImageName) {
        const deleteFile = existingScore.scoreImageName || "";

        // Generate signed URL for the new image
        const signedImage = await createUrl(
          newImageName,
          AWSManager.scoreFolderPath
        );

        existingScore.scoreImage = signedImage;
        existingScore.scoreImageName = newImageName;

        // Delete old image if one existed
        if (deleteFile) {
          await AWSManager.deleteObject(deleteFile, AWSManager.scoreFolderPath);
        }
      }
    }

    await existingScore.save({ session });

    await UserPatch.updateMany(
      { userId, scoreId: existingScore._id, isDeleted: false },
      { $set: { isDeleted: true } },
      { session }
    );

    if (
      ANALYSIS_CATEGORY.includes(categoryObj.name) &&
      roundStreakArr.length > 0 &&
      !isDraft
    ) {
      let previousIsContinue = false;
      let lastValidHighestStreak = 0;

      for (let i = 0; i < roundStreakArr.length; i++) {
        const roundObj = roundStreakArr[i];
        const isLastRound = i === roundStreakArr.length - 1;

        if (roundObj.isContinue)
          lastValidHighestStreak = roundObj.highestStreak;

        const shouldAssign =
          (!roundObj.isContinue && previousIsContinue) || isLastRound;
        if (shouldAssign && lastValidHighestStreak > 0) {
          await assignPatch({
            categoryId,
            highestStreak: lastValidHighestStreak,
            userId,
            scoreId: existingScore._id,
            session,
          });
        }

        previousIsContinue = roundObj.isContinue;
      }
    }

    await session.commitTransaction();
    session.endSession();

    return existingScore;
  } catch (error) {
    console.error("🚨 ~ updateScore ~ error:", error);
    await session.abortTransaction();
    session.endSession();
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Unable to update score. Please try again later."
    );
  }
};

const softDeleteScore = async (req, userId) => {
  const scoreId = req.params.scoreId;

  if (!mongoose.Types.ObjectId.isValid(scoreId)) {
    throw new ApiError(400, "Invalid score ID");
  }

  const session = await mongoose.startSession();
  let transactionStarted = false;
  try {
    await session.startTransaction();
    transactionStarted = true;

    // 1. Soft delete the Score
    const score = await Score.findOneAndUpdate(
      { _id: scoreId, userId, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true, session }
    );
    if (!score) {
      throw new ApiError(404, "Score not found or already deleted");
    }
    if (!Array.isArray(score.roundIds) || score.roundIds.length === 0) {
      await session.commitTransaction();
      session.endSession();
      return score;
    }

    // 2. Soft delete all related ScoreRounds
    await ScoreRound.updateMany(
      { _id: { $in: score.roundIds }, isDeleted: false },
      { $set: { isDeleted: true } },
      { session }
    );

    // 3. Find all postIds from the rounds
    const roundDocs = await ScoreRound.find(
      { _id: { $in: score.roundIds } },
      null,
      { session }
    );
    const allPostIds = roundDocs.reduce((acc, round) => {
      if (Array.isArray(round.postIds)) {
        acc.push(
          ...round.postIds.filter((id) => mongoose.Types.ObjectId.isValid(id))
        );
      }
      return acc;
    }, []);

    // 4. Soft delete all related ScorePosts
    if (allPostIds.length > 0) {
      await ScorePost.updateMany(
        { _id: { $in: allPostIds }, isDeleted: false },
        { $set: { isDeleted: true } },
        { session }
      );
    }

    // 5. Soft delete all related UserPatches
    await UserPatch.updateMany(
      { scoreId: scoreId, userId: userId, isDeleted: false },
      { $set: { isDeleted: true } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    return score;
  } catch (error) {
    if (transactionStarted) {
      await session.abortTransaction();
      session.endSession();
    }
    console.error("❌ Error in softDeleteScore:", error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, "Unable to delete score. Please try again.");
  }
};

const getScore = async (scoreId, userId) => {
  // let pipeline = [
  //   {
  //     $match:{
  //         _id:new mongoose.Types.ObjectId(scoreId),
  //         userId:new mongoose.Types.ObjectId(userId),
  //         isDeleted: false,
  //     }
  //   },
  //   {
  //       $lookup: {
  //           from: "categories",
  //           localField: "categoryId",
  //           foreignField: "_id",
  //           as: "category"
  //       }
  //   },
  //   {
  //     $unwind:{
  //           path:"$category"
  //     }
  //   },
  //   {
  //     $lookup: {
  //       from: "userpatches",
  //       localField: "_id",
  //       foreignField: "scoreId",
  //       as: "userPatches"
  //     }
  //   },
  //   {
  //     $lookup: {
  //       from: "patches",
  //       let: { userPatches: "$userPatches" },
  //       pipeline: [
  //         {
  //           $match: {
  //             $expr: {
  //               $in: [ "$_id", { $map: { input: "$$userPatches", as: "up", in: "$$up.patchId" } } ]
  //             }
  //           }
  //         }
  //       ],
  //       as: "patches"
  //     }
  //   },
  //   {
  //       $lookup: {
  //           from: "scorerounds",
  //           localField: "roundIds",
  //           foreignField: "_id",
  //           as: "rounds",
  //           pipeline:[
  //             {
  //               $lookup: {
  //                   from: "scoreposts",
  //                   localField: "postIds",
  //                   foreignField: "_id",
  //                   as: "posts",
  //                   pipeline:[
  //                     {
  //                       $addFields: {
  //                         totalShots: { $size: "$shots" },
  //                         totalScore: { $sum: "$shots.score" }
  //                       }
  //                     },
  //                     {
  //                       $project:{
  //                         "_id": 1,
  //                         "post": 1,
  //                         "postName": 1,
  //                         "shots":1,
  //                         "totalScore": 1,
  //                         "totalShots":1
  //                       }
  //                     }
  //                   ]
  //               }
  //           },
  //           {
  //             $project:{
  //               "_id": 1,
  //               "roundNo": 1,
  //               "posts":1,
  //               "roundScore":1,
  //               "roundShots":1,
  //               "note":1,
  //             }
  //           }
  //         ]
  //       }
  //   },
  //   {
  //     $project:{
  //       "_id": 1,
  //       "location": 1,
  //       "scoreDate": 1,
  //       "userId": 1,
  //       "category": 1,
  //       "eventType": 1,
  //       "noOfRounds": 1,
  //       "handicap": 1,
  //       "scoreImage": 1,
  //       "scoreImageName": 1,
  //       "rounds":1,
  //       "posts":1,
  //       "totalScore":1,
  //       "totalShots":1,
  //       "patches":1
  //     }
  //   }
  // ];

  let pipeline = [
    {
      $match: {
        _id: new mongoose.Types.ObjectId(scoreId),
        userId: new mongoose.Types.ObjectId(userId),
        isDeleted: false,
      },
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
      },
    },
    {
      $lookup: {
        from: "userpatches",
        localField: "_id",
        foreignField: "scoreId",
        as: "userPatches",
        pipeline: [
          {
            $match: { isDeleted: false }, // ✅ Filter non-deleted patches
          },
          {
            $group: {
              _id: "$patchId",
              patchCount: { $sum: 1 },
            },
          },
          {
            $lookup: {
              from: "patches",
              localField: "_id",
              foreignField: "_id",
              as: "patch",
            },
          },
          {
            $unwind: "$patch",
          },
          {
            $project: {
              _id: 0,
              patchId: "$_id",
              patchCount: 1,
              patch: "$patch",
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "scorerounds",
        localField: "roundIds",
        foreignField: "_id",
        as: "rounds",
        pipeline: [
          {
            $lookup: {
              from: "scoreposts",
              localField: "postIds",
              foreignField: "_id",
              as: "posts",
              pipeline: [
                {
                  $addFields: {
                    totalShots: {
                      $size: "$shots",
                    },
                    totalScore: {
                      $sum: "$shots.score",
                    },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    post: 1,
                    postName: 1,
                    shots: 1,
                    totalScore: 1,
                    totalShots: 1,
                  },
                },
              ],
            },
          },
          {
            $project: {
              _id: 1,
              roundNo: 1,
              posts: 1,
              roundScore: 1,
              roundShots: 1,
              note: 1,
            },
          },
        ],
      },
    },
    {
      $set: {
        patches: {
          $map: {
            input: "$userPatches",
            as: "up",
            in: {
              $mergeObjects: ["$$up.patch", { patchCount: "$$up.patchCount" }],
            },
          },
        },
      },
    },

    {
      $project: {
        _id: 1,
        location: 1,
        longitude: 1,
        latitude: 1,
        scoreDate: 1,
        userId: 1,
        gunId: 1,
        category: 1,
        eventType: 1,
        noOfRounds: 1,
        handicap: 1,
        scoreImage: 1,
        scoreImageName: 1,
        rounds: 1,
        posts: 1,
        totalScore: 1,
        totalShots: 1,
        patches: 1,
      },
    },
  ];

  const scoreData = await Score.aggregate(pipeline);

  if (!scoreData[0]) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No score record found.");
  }

  // Category-specific formatting for 5-Stand Sporting
  if (scoreData[0]?.category?.name === "5-Stand Sporting") {
    scoreData[0].rounds.forEach((round, roundIndex) => {
      round.posts.forEach((post, postIndex) => {
        // Aggregate pair scores and preserve the first seen shot number per pair index
        const pairTotals = { REPORT_PAIR: new Map(), TRUE_PAIR: new Map() };
        const pairShotNo = { REPORT_PAIR: new Map(), TRUE_PAIR: new Map() };
        const singles = [];

        for (const shot of post.shots || []) {
          if (typeof shot?.type !== "string") continue;

          const pairMatch = shot.type.match(
            /^(REPORT_PAIR|TRUE_PAIR)_(\d{1,2})$/
          );
          if (pairMatch) {
            const prefix = pairMatch[1];
            const idx = Number(pairMatch[2]);
            const sScore = Number(shot.score || 0);
            const sShot =
              typeof shot.shot === "number" ? shot.shot : Number(shot.shot);

            // sum scores per pair index
            pairTotals[prefix].set(
              idx,
              (pairTotals[prefix].get(idx) || 0) + sScore
            );

            // preserve the first provided shot number for this pair index
            if (!pairShotNo[prefix].has(idx) && Number.isFinite(sShot)) {
              pairShotNo[prefix].set(idx, sShot);
            }
            continue;
          }

          // Keep SINGLE shots as-is, bound score 0..1, preserve original shot
          if (shot.type === "SINGLE") {
            const bounded = Math.max(0, Math.min(1, Number(shot.score || 0)));
            const sShot =
              typeof shot.shot === "number" ? shot.shot : Number(shot.shot);
            singles.push({
              type: "SINGLE",
              shot: Number.isFinite(sShot) ? sShot : undefined,
              score: bounded,
            });
          }
        }

        // Build normalized list: pairs (sorted by index), then singles (sorted by shot)
        const normalizedShots = [];
        for (const prefix of ["REPORT_PAIR", "TRUE_PAIR"]) {
          const indices = Array.from(pairTotals[prefix].keys()).sort(
            (a, b) => a - b
          );
          for (const idx of indices) {
            const total = pairTotals[prefix].get(idx);
            const bounded = Math.max(0, Math.min(2, Number(total)));
            normalizedShots.push({
              type: `${prefix}_${idx}`,
              shot: pairShotNo[prefix].get(idx), // original shot number (unchanged)
              score: bounded,
            });
          }
        }

        singles.sort((a, b) => {
          if (Number.isFinite(a.shot) && Number.isFinite(b.shot))
            return a.shot - b.shot;
          return 0;
        });
        normalizedShots.push(...singles);

        const formattedPost = JSON.parse(JSON.stringify(post));
        formattedPost.shots = normalizedShots;
        round.posts[postIndex] = formattedPost;
      });

      scoreData[0].rounds[roundIndex] = JSON.parse(JSON.stringify(round));
    });

    return scoreData[0];
  }

  if (CONDITIONAL_CATEGORY.includes(scoreData[0]?.category.name)) {
    scoreData[0].rounds.map((round, index) => {
      round.posts.map((post, idx) => {
        let doubleHigh = "-";
        let doubleLow = "-";
        let singleHigh = "-";
        let singleLow = "-";

        post.shots.map((shot) => {
          if (shot.type == "DOUBLE_HIGH") {
            doubleHigh =
              doubleHigh == "-" ? shot.score : doubleHigh + shot.score;
          } else if (shot.type == "DOUBLE_LOW") {
            doubleLow = doubleLow == "-" ? shot.score : doubleLow + shot.score;
          } else if (shot.type == "SINGLE_HIGH") {
            singleHigh =
              singleHigh == "-" ? shot.score : singleHigh + shot.score;
          } else if (shot.type == "SINGLE_LOW") {
            singleLow = singleLow == "-" ? shot.score : singleLow + shot.score;
          }
        });

        const newShotObj = [
          {
            type: "SINGLE_HIGH",
            score: singleHigh.toString(),
          },
          {
            type: "SINGLE_LOW",
            score: singleLow.toString(),
          },
          {
            type: "DOUBLE_HIGH",
            score: doubleHigh.toString(),
          },
          {
            type: "DOUBLE_LOW",
            score: doubleLow.toString(),
          },
        ];

        let formattedPost = JSON.parse(JSON.stringify(post));
        formattedPost.shots = newShotObj;
        round.posts[idx] = formattedPost;
      });

      let formattedRound = JSON.parse(JSON.stringify(round));
      scoreData[0].rounds[index] = formattedRound;
    });

    return scoreData[0];
  }

  return scoreData[0];
};

function getDateRange(startDate, endDate) {
  let start = null;
  let end = null;

  if (startDate) {
    start = moment(startDate).startOf("day").utc().toDate();
  }

  if (endDate) {
    if (moment(startDate).isSame(endDate, "day")) {
      end = moment(endDate).endOf("day").utc().toDate(); // 23:59:59.999 UTC
    } else {
      end = moment(endDate).endOf("day").utc().toDate();
    }
  }

  return { start, end };
}

const listScore = async (reqBody, userId) => {
  const {
    page = 1,
    limit = 10,
    categoryId,
    eventId,
    search,
    startDate,
    endDate,
    eventType,
  } = reqBody;

  let filter = {
    userId: new mongoose.Types.ObjectId(userId),
    isDeleted: false,
    categoryId: new mongoose.Types.ObjectId(categoryId),
  };

  if (startDate && endDate) {
    if (startDate > endDate) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid date selection!");
    }
    const { start, end } = getDateRange(startDate, endDate);
    filter.createdAt = {
      ...(start && { $gte: start }),
      ...(end && { $lte: end }),
    };
  }

  if (eventId) {
    filter.eventId = new mongoose.Types.ObjectId(eventId);
  }
  if (eventType) {
    filter.eventType = eventType;
  }

  let pipeline = [
    {
      $match: filter,
    },
    {
      $lookup: {
        from: "events",
        localField: "eventId",
        foreignField: "_id",
        as: "event",
      },
    },
    {
      $unwind: {
        path: "$event",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "userpatches",
        localField: "_id",
        foreignField: "scoreId",
        as: "userpatches",
        pipeline: [
          {
            $match: {
              isDeleted: false,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        isPatch: {
          $gt: [{ $size: "$userpatches" }, 0],
        },
      },
    },
    {
      $project: {
        _id: 1,
        location: 1,
        longitude: 1,
        latitude: 1,
        scoreDate: {
          $dateTrunc: {
            date: "$scoreDate",
            unit: "day",
            timezone: "UTC",
          },
        },
        userId: 1,
        categoryId: 1,
        gunId: 1,
        eventType: 1,
        noOfRounds: 1,
        handicap: 1,
        totalShots: 1,
        totalScore: 1,
        isDeleted: 1,
        createdAt: 1,
        updatedAt: 1,
        isPatch: 1,
        isDraft: 1,
      },
    },
    {
      $sort: {
        scoreDate: -1, // Sort by scoreDate in descending order (future dates first)
        updatedAt: -1, // Then by createdAt for scores with same date (latest created first)
      },
    },
    {
      $facet: {
        totalRecords: [{ $count: "total" }],
        results: [{ $skip: (page - 1) * limit }, { $limit: limit }],
      },
    },
    {
      $addFields: {
        totalRecords: {
          $ifNull: [{ $arrayElemAt: ["$totalRecords.total", 0] }, 0],
        },
      },
    },
  ];

  const [score] = await Score.aggregate(pipeline);

  let data = {
    totalRecords: 0,
    result: [],
    page: page,
    totalPages: 0,
  };

  if (score.totalRecords < 1) {
    return data;
  } else {
    data = {
      totalRecords: score.totalRecords,
      results: score.results,
      page: page,
      totalPages: Math.ceil(score.totalRecords / limit),
    };
  }

  return data;
};

const userGunList = async (search, userId) => {
  let filter = {
    userId: new mongoose.Types.ObjectId(userId),
    status: "APPROVED",
    isDeleted: false,
  };

  if (search) {
    filter.name = { $regex: `.*${search.toLowerCase()}.*`, $options: "i" };
  }

  let pipeline = [
    {
      $match: filter,
    },
    {
      $project: {
        _id: 1,
        name: 1,
        model: 1,
        brand: 1,
      },
    },
  ];

  const gunSafe = await GunSafe.aggregate(pipeline);

  data = {
    results: gunSafe,
  };

  return data;
};

const getScorePDF = async (reqBody) => {
  const pdf = await pdfScoreGenerator(reqBody);
  return pdf;
};

module.exports = {
  createScore,
  editScore,
  getScore,
  softDeleteScore,
  listScore,
  userGunList,
  getScorePDF,
  getHighestStreak,
};
