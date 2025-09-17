const puppeteer = require('puppeteer');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const { CONDITIONAL_CATEGORY } = require('../config/config');
const templatePath = path.join(__dirname);

module.exports.pdfAnalysisGenerator = async (data)=>{
  let {missedPercentage,hitPercentage,highestScore,averageScore,averageRoundScoresByRound,
    averagePostScoresByPost,highestRoundScoresByRound,highestPostScoresByPost,
    topHitPercentageRoundWithGun,highestScoreByGun,averageScoreByGun,
    highestPostHitPercentByPost,averagePostHitPercentByPost,category,top5ScorePercent,
    scoresByNoOfRounds,averageScorePercentage,highestRoundScore,averageRoundScore,averageStationScorePercentage } = data;
    let condition = false;

    let roundName = "Round";
    let postName = "Post";

    if(CONDITIONAL_CATEGORY.includes(category.name)){
      postName = "Station";
    }

    if("5-Stand" == category.name){
      postName = "Stand";
    }

    if("FITASC" == category.name){
      roundName = "Parcour";
      postName = "Peg";
    }

    if(category.name == "Sporting Clays"){
      condition = true;
    }

    averageRoundScoresByRound = averageRoundScoresByRound.map(item => ({
      roundNo: `${roundName} ${item.roundNo}`,
      averageScore: Number(item.averageScore.toFixed(1)),
      isHide:condition,
      roundName:roundName
    }));

    highestRoundScoresByRound = highestRoundScoresByRound.map(item => ({
      roundNo:`${roundName} ${item.roundNo}`,
      highestScore: Number(item.highestScore.toFixed(1)),
      isHide:condition,
      roundName:roundName
    }));

    highestPostScoresByPost = highestPostScoresByPost.map(item => ({
      post: `${postName} ${item.post}`,
      highestScore: Number(item.highestScore.toFixed(1)),
      isStation:false,
      postName:postName
    }));

    highestPostHitPercentByPost = highestPostHitPercentByPost.map(item => ({
      post: `Station ${item.post}`,
      highestScore: Number(item.highestScore.toFixed(1)) + " %",
      isStation:true,
    }));

    averagePostScoresByPost = averagePostScoresByPost.map(item => ({
      post: `${postName} ${item.post}`,
      averageScore: Number(item.averageScore.toFixed(1)),
      isStation:false,
      postName:postName
    }));

    averagePostHitPercentByPost = averagePostHitPercentByPost.map(item => ({
      post: `Station ${item.post}`,
      averageScore: Number(item.averageScore.toFixed(1)) + " %",
      isStation:true
    }));

    topHitPercentageRoundWithGun = topHitPercentageRoundWithGun.map(item => ({
      roundNo: item.roundNo,
      gun: item.gun.name?item.gun.name:"-",
      hitPercentage:item.hitPercentage
    }));

    top5ScorePercent = top5ScorePercent.map((item,idx) => ({
      scoreNo: idx+1,
      scorePercentage: Number(item.scorePercentage.toFixed(1)),
      isHide:!condition
    }));

    scoresByNoOfRounds = scoresByNoOfRounds.map(item => ({
      roundNo: item.noOfRounds,
      highestScore: Number(item.highestScore.toFixed(1)),
      averageScore: Number(item.averageScore.toFixed(1)),
      isHide:condition,
      roundName:roundName
    }));

    averageScoreByGun = averageScoreByGun.map(item => ({
      _id:item._id ,
      name:item.name ,
      chokeSize:item.chokeSize ,
      model:item.model ,
      averageScore:item.averageScore?Number(item.averageScore.toFixed(1)):"-",
    }));

  const templateName="pdfAnalysis.html";
  const htmlPath = templatePath.replace("/utils", `/template/${templateName}`);

  let htmlContent = fs.readFileSync(htmlPath, 'utf8');

  htmlContent = htmlContent.replace('__TARGET_MISSED__', hitPercentage);
  
  htmlContent = htmlContent.replace('__ROUND_NAME__', roundName?roundName:"Round");
  htmlContent = htmlContent.replace('__IS_BAR_VALUE__', condition);

  htmlContent = htmlContent.replace('__TARGET_HIT__', missedPercentage);

  htmlContent = htmlContent.replace('__HIGHEST__', condition?averageScorePercentage.toFixed(1):highestRoundScore.toFixed(1));

  htmlContent = htmlContent.replace('__AVERAGE__', condition?averageStationScorePercentage.toFixed(1):averageRoundScore.toFixed(1));

  htmlContent = htmlContent.replace('__TOP_SCORE_ROUND__', `${JSON.stringify(highestRoundScoresByRound)}`);

  htmlContent = htmlContent.replace('__TOP_SCORE_POST__', condition?`${JSON.stringify(highestPostHitPercentByPost)}`:`${JSON.stringify(highestPostScoresByPost)}`);

  htmlContent = htmlContent.replace('__CATEGORY__', category.name?category.name:"");

  htmlContent = htmlContent.replace('__AVG_SCORE_ROUND__', `${JSON.stringify(averageRoundScoresByRound)}`);

  htmlContent = htmlContent.replace('__AVG_SCORE_POST__', condition?`${JSON.stringify(averagePostHitPercentByPost)}`:`${JSON.stringify(averagePostScoresByPost)}`);

  htmlContent = htmlContent.replace('__HIT_PERCENT_FIREARM_ROUND__', `${JSON.stringify(topHitPercentageRoundWithGun)}`);

  htmlContent = htmlContent.replace('__HIGHEST_FIREARM_PERCENT__', `${JSON.stringify(highestScoreByGun)}`);

  htmlContent = htmlContent.replace('__AVERAGE_FIREARM_PERCENT__', `${JSON.stringify(averageScoreByGun)}`);

  htmlContent = htmlContent.replace('__TOP_5__', `${JSON.stringify(top5ScorePercent)}`);

  htmlContent = htmlContent.replace('__TOP_EVENT__', `${JSON.stringify(scoresByNoOfRounds)}`);

  htmlContent = htmlContent.replace('__AVG_EVENT__', `${JSON.stringify(scoresByNoOfRounds)}`);

  htmlContent = htmlContent.replace('__AVG_HIT_PERCENT__', `${JSON.stringify({score:averageScorePercentage.toFixed(1),isHide:!condition})}`);
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  // Optional: Wait for chart to render
  await page.waitForSelector('canvas');

  const pdfBuffer = await page.pdf({
    //path: 'test-report.pdf',
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0mm',
      right: '0mm',
      bottom: '0mm',
      left: '0mm',
    }
  });

  await browser.close();
  console.log('PDF created successfully!');
  return Buffer.from(pdfBuffer);
};


module.exports.pdfScoreGenerator = async (data,category="American Trap")=>{
    
    let roundName = "Round";
    let postName = "Post";
    let isStation = false;

    if(CONDITIONAL_CATEGORY.includes(data.category.name)){
      postName = "Station";
    }

    if("5-Stand" == data.category.name){
      postName = "Stand";
    }

    if("FITASC" == data.category.name){
      roundName = "Parcour";
      postName = "Peg";
    }

    if("Sporting Clays" == data.category.name){
      postName = "Station";
      isStation = true;
    }

  let htmlContent = generateFullHtml(data,postName,roundName,isStation);
  
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    //path: 'test-report.pdf',
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0mm',
      right: '0mm',
      bottom: '0mm',
      left: '0mm',
    }
  });

  await browser.close();
  console.log('PDF created successfully!');
  return Buffer.from(pdfBuffer);
};

function generateFullHtml(data, postName = "Post",roundName = "Round",isStation = false) {
  const { rounds } = data;
  let roundStation = rounds[0].posts?rounds[0].posts.length:0;
  function generateRoundsHtml(rounds = []) {
    return rounds.map(round => {
      const maxShots = Math.max(...round.posts.map(post => post.shots.length));

      let tableHeader = `
        <thead>
          <tr>
            <th>${postName}</th>
            ${Array.from({ length: maxShots }, (_, i) => `<th>Shot ${String(i + 1).padStart(2, '0')}</th>`).join('')}
            <th>Score</th>
          </tr>
        </thead>
      `;

      let tableBody = '';
      const columnTotals = Array(maxShots).fill(0);
      let totalScoreForRound = 0;

      round.posts.forEach(post => {
        const scores = post.shots.map(shot => parseInt(shot.score || 0));
        const scoreSum = scores.reduce((sum, s) => sum + s, 0);
        totalScoreForRound += scoreSum;

        tableBody += `<tr><td>${postName} ${String(post.post)}</td>`;
        for (let i = 0; i < maxShots; i++) {
          const score = scores[i] !== undefined ? String(scores[i]).padStart(2, '0') : '00';
          if (scores[i] !== undefined) columnTotals[i] += scores[i];
          tableBody += `<td>${score}</td>`;
        }
        tableBody += `<td>${String(scoreSum).padStart(2, '0')}</td></tr>`;
      });

      let totalRow = `
        <tr>
          <td><strong>Total</strong></td>
          ${columnTotals.map(score => `<td><strong>${String(score)}</strong></td>`).join('')}
          <td><strong>${totalScoreForRound}</strong></td>
        </tr>
      `;
      return `
        <h2>${isStation ? "" : `${roundName} ${String(round.roundNo)}`}</h2>
        <table>
          ${tableHeader}
          <tbody>
            ${tableBody}
            ${totalRow}
          </tbody>
        </table>
       <h4>${round.note ? `<h3>Note:</h3> ${round.note}` : ""}</h4>
      `;
    }).join('');
  }
   // on line 272 <h4>${round.note ? `<h3>Note:</h3> ${round.note}` : ""}</h4>
  let categoryName = data.category.name || 'Category Unknown';
  let roundLabel = isStation?`${roundStation} Stations`:`${data.noOfRounds || 'Date Unknown'} ${data.noOfRounds > 1 ? `${roundName}`+'s' : `${roundName}`}`;
  const topSection = `
      <div style="background-color: #1e1e1e; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    
    <div>
      <h1 style="color: #e74c3c; font-size: 24px; margin: 0 0 0px 0;">${data.location || 'Location Unknown'}</h1>
      <p style="color: #ccc; margin: 0 0 5px;">${categoryName}, ${moment(data.scoreDate).format('MM/DD/YYYY') || 'Date Unknown'}</p>
      <p style="color: #ccc; margin: 0 0 5px;">${data.handicap || ""} ${roundLabel}</p>
      <p style="color: #ccc; margin: 0 0 10px;">${data.eventType || ''}</p>
      <p style="color: white; margin: 0;">Total Score: <span style="color: #4caf50;">${data.totalScore}</span> / ${data.totalShots}</p>
    </div>

      <div style="margin: 20px 0 0 0; display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
        ${
          Array.isArray(data.patches) && data.patches.length
            ? data.patches.map(patch => `
                <img 
                  src="${patch.patchImage}" 
                  alt="Patch" 
                  style="height: 150px; width: 150px; object-fit: cover; border-radius: 4px;" 
                />
              `).join('')
            : ''
        }
      </div>

  </div>
  `;

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Score Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          background-color: #121212;
          color: #fff;
        }
        h1 {
          color: #fff;
        }
        h2 {
          color: #e53935;
        }
        .summary {
          margin-bottom: 30px;
        }
        .summary p {
          margin: 4px 0;
        }
        .summary img {
          height: 100px;
          margin-right: 20px;
          vertical-align: middle;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          background-color: #1e1e1e;
        }
        th, td {
          border: 1px solid #444;
          padding: 8px;
          text-align: center;
        }
        th {
          background-color: #2c2c2c;
        }
        td {
          color: #ccc;
        }
        td strong, th strong {
          color: #e53935;
        }
          .round-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
        font-size: 14px;
        color: #fff;
        }

        .round-table th,
        .round-table td {
          border: 1px solid #555;
          padding: 8px;
          text-align: center;
        }

        .round-table th {
          background-color: #333;
        }

        .round-table td.red-border {
          font-weight: bold;
          color: #f55;
        }

        .round-table tr:last-child {
          background-color: #111;
        }
      </style>
    </head>
    <body>
      <div style="display: flex; align-items: center; margin: 0px 0px 10px 0px;">
        <img src="https://breakin-clays-dev.s3.us-east-1.amazonaws.com/public/Frame.png" style="height: 70px; width: 70px; object-fit: contain; margin: 0px 0px 0px 0px; padding: 10px 10px 10px 0px;">
        <h1><span style="color: #C80034;">Score</span> Report</h1>
      </div>
      ${topSection}

      ${
        CONDITIONAL_CATEGORY.includes(data.category.name)
          ? rounds.map((round,index) => generateSkeetTable(round,index)).join('')
          : generateRoundsHtml(rounds)
      }
    </body>
  </html>
  `;
}

function generateSkeetTable(round,roundIndex) {
  const SHOT_TYPES = ["SINGLE_HIGH", "SINGLE_LOW", "DOUBLE_HIGH", "DOUBLE_LOW"];
  const SHOT_LABELS = {
    SINGLE_HIGH: "SGL H",
    SINGLE_LOW: "SGL L",
    DOUBLE_HIGH: "DBL H",
    DOUBLE_LOW: "DBL L",
  };

  // Initialize totals for each shot type
  const shotTypeTotals = {
    SINGLE_HIGH: 0,
    SINGLE_LOW: 0,
    DOUBLE_HIGH: 0,
    DOUBLE_LOW: 0,
  };

  const rows = round.posts.map((post, index) => {
    const shotMap = {
      SINGLE_HIGH: "-",
      SINGLE_LOW: "-",
      DOUBLE_HIGH: "-",
      DOUBLE_LOW: "-",
    };

    post.shots.forEach((shot) => {
      shotMap[shot.type] = shot.score;
      // If it's a valid score (not "-"), count it
      if (shot.score !== "-") {
        shotTypeTotals[shot.type] += parseInt(shot.score);
      }
    });

    return `
      <tr>
        <td>Station ${index + 1}</td>
        <td>${shotMap.SINGLE_HIGH}</td>
        <td>${shotMap.SINGLE_LOW}</td>
        <td>${shotMap.DOUBLE_HIGH}</td>
        <td>${shotMap.DOUBLE_LOW}</td>
        <td>${post.totalScore}/${post.totalShots}</td>
      </tr>
    `;
  });

  // Round total row (with red border classes)
  const roundTotalRow = `
    <tr>
      <td class="red-border">Total</td>
      <td class="red-border">${shotTypeTotals.SINGLE_HIGH}</td>
      <td class="red-border">${shotTypeTotals.SINGLE_LOW}</td>
      <td class="red-border">${shotTypeTotals.DOUBLE_HIGH}</td>
      <td class="red-border">${shotTypeTotals.DOUBLE_LOW}</td>
      <td class="red-border">${round.roundScore}/${round.roundShots}</td>
    </tr>
  `;

  return `
  <h2>Round ${roundIndex + 1}</h2>
    <table class="round-table">
      <thead>
        <tr>
          <th>Stations</th>
          ${SHOT_TYPES.map(type => `<th>${SHOT_LABELS[type]}</th>`).join("")}
          <th>Score</th>
        </tr>
      </thead>
      <tbody>
        ${rows.join("")}
        ${roundTotalRow}
      </tbody>
    </table>
        <h4>${round.note ? `<h3>Note:</h3> ${round.note}` : ""}</h4>
  `;
}

