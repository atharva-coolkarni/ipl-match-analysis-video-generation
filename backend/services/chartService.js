// // backend/services/chartService.js
// const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
// const ffmpeg = require('fluent-ffmpeg');
// const fs = require('fs');
// const path = require('path');

// ffmpeg.setFfmpegPath('C:/ffmpeg/ffmpeg-2025-10-16-git-cd4b01707d-full_build/bin/ffmpeg.exe');
// ffmpeg.setFfprobePath('C:/ffmpeg/ffmpeg-2025-10-16-git-cd4b01707d-full_build/bin/ffprobe.exe');

// const WIDTH = 1920;
// const HEIGHT = 1080;

// const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: WIDTH, height: HEIGHT });

// const generateCharts = async (matchData, commentary) => {
//     const chartSegments = [];

//     chartSegments.push(await generateTeamComparisonChart(matchData));
//     chartSegments.push(await generateBattingChart(matchData));
//     chartSegments.push(await generateStrikeRateChart(matchData));
//     chartSegments.push(await generateTopScorersChart(matchData));
//     chartSegments.push(await generateWicketsPerOverChart(matchData));

//     return chartSegments;
// };

// const generateTeamComparisonChart = async (matchData) => {
//     const teams = matchData.teams;
//     const runs = matchData.innings.map(inning => {
//         return inning.batting.reduce((sum, p) => p.player !== 'Extras' ? sum + parseInt(p.runs || 0) : sum, 0);
//     });

//     const configuration = {
//         type: 'bar',
//         data: {
//             labels: teams,
//             datasets: [{ label: 'Total Runs', data: runs, backgroundColor: ['#FF6384', '#36A2EB'] }]
//         },
//         options: { responsive: false, plugins: { title: { display: true, text: 'Team Runs Comparison', font: { size: 24 } } } }
//     };

//     return await renderChartToVideo(configuration, 'team_comparison.png', 5);
// };

// const generateBattingChart = async (matchData) => {
//     const batters = matchData.innings.flatMap(i => i.batting.filter(p => p.player !== 'Extras'));
//     const labels = batters.map(p => p.player);
//     const runs = batters.map(p => parseInt(p.runs || 0));

//     const configuration = {
//         type: 'bar',
//         data: { labels, datasets: [{ label: 'Runs Scored', data: runs, backgroundColor: '#36A2EB' }] },
//         options: { responsive: false, plugins: { title: { display: true, text: 'Individual Batting Performance', font: { size: 24 } } }, scales: { y: { beginAtZero: true } } }
//     };

//     return await renderChartToVideo(configuration, 'batting_chart.png', 5);
// };

// const generateStrikeRateChart = async (matchData) => {
//     const batters = matchData.innings.flatMap(i => i.batting.filter(p => p.player !== 'Extras'));
//     const labels = batters.map(p => p.player);
//     const strikeRates = batters.map(p => ((parseInt(p.runs || 0) / Math.max(parseInt(p.balls || 1), 1)) * 100).toFixed(2));

//     const configuration = {
//         type: 'bar',
//         data: { labels, datasets: [{ label: 'Strike Rate', data: strikeRates, backgroundColor: '#FF6384' }] },
//         options: { responsive: false, plugins: { title: { display: true, text: 'Strike Rate Comparison', font: { size: 24 } } }, scales: { y: { beginAtZero: true } } }
//     };

//     return await renderChartToVideo(configuration, 'strike_rate_chart.png', 5);
// };


// const generateTopScorersChart = async (matchData) => {
//     const batters = matchData.innings.flatMap(i => i.batting.filter(p => p.player !== 'Extras'));
//     const sorted = [...batters].sort((a, b) => (parseInt(b.runs || 0) - parseInt(a.runs || 0))).slice(0, 3);
//     const labels = sorted.map(p => p.player);
//     const runs = sorted.map(p => parseInt(p.runs || 0));

//     const configuration = {
//         type: 'bar',
//         data: { labels, datasets: [{ label: 'Top 3 Scorers', data: runs, backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56'] }] },
//         options: { responsive: false, plugins: { title: { display: true, text: 'Top 3 Scorers', font: { size: 24 } } }, scales: { y: { beginAtZero: true } } }
//     };

//     return await renderChartToVideo(configuration, 'top_scorers.png', 5);
// };


// const generateWicketsPerOverChart = async (matchData) => {
//     const overs = Array.from({ length: 20 }, (_, i) => i + 1);
//     const wickets = overs.map(() => Math.floor(Math.random() * 2)); // 0-1 wickets per over

//     const configuration = {
//         type: 'line',
//         data: { labels: overs, datasets: [{ label: 'Wickets per Over', data: wickets, borderColor: '#FF6384', fill: false }] },
//         options: { responsive: false, plugins: { title: { display: true, text: 'Wickets Per Over (Turning Points)', font: { size: 24 } } }, scales: { y: { beginAtZero: true, stepSize: 1 } } }
//     };

//     return await renderChartToVideo(configuration, 'wickets_per_over.png', 5);
// };


// const renderChartToVideo = async (configuration, filename, duration) => {
//     const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
//     const imagePath = path.join(__dirname, '../temp', filename);
//     fs.writeFileSync(imagePath, imageBuffer);

//     const outputPath = imagePath.replace('.png', '.mp4');

//     return new Promise((resolve, reject) => {
//         ffmpeg()
//             .input(imagePath)
//             .inputOptions(['-loop 1', `-t ${duration}`])
//             .outputOptions(['-c:v libx264', '-pix_fmt yuv420p'])
//             .output(outputPath)
//             .on('end', () => resolve(outputPath))
//             .on('error', reject)
//             .run();
//     });
// };

// module.exports = { generateCharts };



const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

ffmpeg.setFfmpegPath('C:/ffmpeg/ffmpeg-2025-10-16-git-cd4b01707d-full_build/bin/ffmpeg.exe');
ffmpeg.setFfprobePath('C:/ffmpeg/ffmpeg-2025-10-16-git-cd4b01707d-full_build/bin/ffprobe.exe');

const WIDTH = 1920;
const HEIGHT = 1080;
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: WIDTH, height: HEIGHT });

const generatePresentationSegments = async (matchData, commentaryScript) => {
  const segments = [];
  const segmentOrder = ['introduction', 'key_batting', 'turning_points', 'final_analysis', 'player_of_match'];

  for (const segmentName of segmentOrder) {
    console.log(`Generating chart & video for: ${segmentName}`);
    const imagePath = await generateSegmentImage(matchData, segmentName);
    const videoPath = await convertImageToVideo(imagePath, segmentName);

    segments.push({ path: videoPath, segment: segmentName });
  }

  return segments;
};

const convertImageToVideo = async (imagePath, segmentName) => {
  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const outputPath = path.join(tempDir, `${segmentName}.mp4`);

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(imagePath)
      .loop(1)
      .duration(30)
      .outputOptions(['-c:v libx264', '-pix_fmt yuv420p', '-r 25', '-shortest'])
      .save(outputPath)
      .on('end', () => {
        console.log(`Generated 30s video: ${segmentName}.mp4`);
        resolve(outputPath);
      })
      .on('error', (err) => reject(err));
  });
};

const generateSegmentImage = async (matchData, segmentName) => {
  switch(segmentName){
    case 'introduction': return generateTeamComparisonImage(matchData, segmentName);
    case 'key_batting': return generateBattingPerformanceImage(matchData, segmentName);
    case 'turning_points': return generateWicketsTimelineImage(matchData, segmentName);
    case 'final_analysis': return generateMatchResultImage(matchData, segmentName);
    case 'player_of_match': return generatePlayerComparisonImage(matchData, segmentName);
    default: return generateGenericBackground(segmentName);
  }
};

// --- Chart generation functions ---

// Team total runs comparison (bars per team)
const generateTeamComparisonImage = async (matchData, segmentName) => {
  const teams = matchData.teams || ['Team A','Team B'];
  const runs = matchData.innings.map(i => i.batting.reduce((s,p) => p.player!=='Extras'?s+parseInt(p.runs||0):s,0));
  const config = {
    type:'bar',
    data:{
      labels: teams,
      datasets:[{
        label:'Total Runs',
        data:runs,
        backgroundColor:['#36A2EB','#FF6384']
      }]
    },
    options:getChartOptions('Team Runs Comparison','bar')
  };
  return renderChartToPNG(config, `${segmentName}.png`);
};

// Batting performance: color by team
const generateBattingPerformanceImage = async (matchData, segmentName) => {
  const batters = matchData.innings.flatMap((inning, teamIdx) =>
    inning.batting
      .filter(p => p.player !== 'Extras')
      .map(p => ({ ...p, teamIdx }))
  );

  const topBatters = batters.sort((a,b)=>parseInt(b.runs||0)-parseInt(a.runs||0)).slice(0,6);

  const config = {
    type:'bar',
    data:{
      labels: topBatters.map(p => p.player),
      datasets:[{
        label:'Runs',
        data: topBatters.map(p => parseInt(p.runs||0)),
        backgroundColor: topBatters.map(p => p.teamIdx === 0 ? '#36A2EB' : '#FF6384')
      }]
    },
    options:getChartOptions('Top Batting Performances','bar')
  };

  return renderChartToPNG(config, `${segmentName}.png`);
};

// Wickets timeline (cumulative) with separate lines per team
const generateWicketsTimelineImage = async (matchData, segmentName) => {
  const overs = Array.from({ length: 20 }, (_, i) => `Over ${i+1}`);

  // Initialize cumulative wickets per team
  const teamWickets = matchData.teams.map(() => Array(overs.length).fill(0));
  const cumulativeWickets = [0,0];

  for (let i = 0; i < overs.length; i++) {
    matchData.innings.forEach((inning, teamIdx) => {
      const wicketsThisOver = inning.overs?.[i]?.wickets || 0; // You can adjust field
      cumulativeWickets[teamIdx] += wicketsThisOver;
      teamWickets[teamIdx][i] = cumulativeWickets[teamIdx];
    });
  }

  const config = {
    type:'line',
    data:{
      labels: overs,
      datasets: matchData.teams.map((team, idx) => ({
        label: `${team} Wickets`,
        data: teamWickets[idx],
        borderColor: idx === 0 ? '#36A2EB' : '#FF6384',
        backgroundColor: idx === 0 ? 'rgba(54,162,235,0.2)' : 'rgba(255,99,132,0.2)',
        fill: false,
        tension: 0.3
      }))
    },
    options:getChartOptions('Cumulative Wickets Timeline','line')
  };

  return renderChartToPNG(config, `${segmentName}.png`);
};

// Match result: pie chart
const generateMatchResultImage = async (matchData, segmentName) => {
  const teams = matchData.teams || ['Team A','Team B'];
  const runs = matchData.innings.map(i => i.batting.reduce((s,p)=>p.player!=='Extras'?s+parseInt(p.runs||0):s,0));
  const config = {
    type:'pie',
    data:{
      labels: teams,
      datasets:[{
        label:'Runs',
        data:runs,
        backgroundColor:['#36A2EB','#FF6384','#FFCE56','#4BC0C0']
      }]
    },
    options:getChartOptions('Match Run Distribution','pie')
  };
  return renderChartToPNG(config, `${segmentName}.png`);
};

// Player comparison: radar chart
const generatePlayerComparisonImage = async (matchData, segmentName) => {
  const batters = matchData.innings.flatMap((i,teamIdx) =>
    i.batting
      .filter(p => p.player!=='Extras')
      .map(p => ({ ...p, teamIdx }))
  ).sort((a,b)=>parseInt(b.runs||0)-parseInt(a.runs||0)).slice(0,4);

  const config = {
    type:'radar',
    data:{
      labels:['Runs','Strike Rate','Boundaries','Consistency'],
      datasets: batters.map((p,i) => ({
        label: p.player,
        data:[
          parseInt(p.runs)||0,
          (parseInt(p.runs)||0)/Math.max(parseInt(p.balls)||1,1)*100,
          Math.floor(parseInt(p.runs||0)/10),
          70+Math.random()*30
        ],
        backgroundColor: p.teamIdx === 0 ? 'rgba(54,162,235,0.2)' : 'rgba(255,99,132,0.2)',
        borderColor: p.teamIdx === 0 ? 'rgb(54,162,235)' : 'rgb(255,99,132)',
        borderWidth: 2
      }))
    },
    options:getChartOptions('Player Performance Comparison','radar')
  };

  return renderChartToPNG(config, `${segmentName}.png`);
};

// Generic background for unknown segment
const generateGenericBackground = async (segmentName) => {
  const colors = ['#2b2d42','#1d3557','#003566','#2a9d8f','#e76f51'];
  const color = colors[Math.floor(Math.random()*colors.length)];
  const config = {
    type:'bar',
    data:{labels:[], datasets:[]},
    options:{
      responsive:false,
      plugins:{title:{display:true,text:segmentName.toUpperCase(), font:{size:32, weight:'bold'}, color:'#fff'}},
      layout:{padding:200},
      backgroundColor: color
    }
  };
  return renderChartToPNG(config, `${segmentName}.png`);
};

// Chart rendering helper
const getChartOptions = (title,type) => ({
  responsive:false,
  plugins:{
    title:{display:true,text:title,font:{size:28,weight:'bold'},color:'#fff'},
    legend:{labels:{color:'#fff', font:{size:16}}}
  },
  scales: type==='bar'||type==='line'?{
    x:{ticks:{color:'#fff', font:{size:14}}, grid:{color:'rgba(255,255,255,0.1)'}},
    y:{ticks:{color:'#fff', font:{size:14}}, grid:{color:'rgba(255,255,255,0.1)'}}
  }: undefined,
  backgroundColor:'#1a1a1a'
});

const renderChartToPNG = async (config, filename) => {
  const tempDir = path.join(__dirname,'../temp');
  if(!fs.existsSync(tempDir)) fs.mkdirSync(tempDir,{recursive:true});
  const outputPath = path.join(tempDir,filename);
  const buffer = await chartJSNodeCanvas.renderToBuffer(config);
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
};

module.exports = { generatePresentationSegments };
