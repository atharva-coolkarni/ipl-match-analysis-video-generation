const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: 'D:/Academics/guild/backend/.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

const generateCommentary = async (matchData) => {
  try {
    const { year, team1, team2 } = matchData;
    console.log(`Starting commentary for ${team1} vs ${team2} in IPL ${year}`);

    // Load JSON match data if exists
    const filePath = path.join(__dirname, '..', 'data', `ipl_${year}.json`);
    let matches = [];
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      matches = JSON.parse(fileContent);
    } catch (e) { console.log('No match file found, using provided matchData'); }

    // Filter matches by teams
    const filteredMatches = matches.filter((match) => {
      const teams = (match.teams || []).map(t => t.toUpperCase());
      return teams.includes((team1 || '').toUpperCase()) && teams.includes((team2 || '').toUpperCase());
    });

    const sourceMatch = filteredMatches.length > 0 ? filteredMatches[0] : matchData;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is missing');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { maxOutputTokens: 2048, temperature: 0.1 },
    });

    const segments = ['introduction','key_batting','turning_points','final_analysis','player_of_match'];
    const commentary = {};
    const matchContext = JSON.stringify(sourceMatch, null, 2);

    for (const segment of segments) {
      const humanReadable = segment.replace(/_/g, ' ');
      const prompt = `You are an expert cricket commentator. Write ONLY the ${humanReadable} segment for IPL commentary between ${team1} and ${team2} (${year}). Keep it concise and professional. \n\nMatch Data:\n${matchContext}`;

      const result = await model.generateContent(prompt);
      let text = (await (await result.response).text()).trim();

      if (text.startsWith('```')) {
        const lines = text.split('\n');
        if (lines[0].startsWith('```')) lines.shift();
        if (lines[lines.length - 1].startsWith('```')) lines.pop();
        text = lines.join('\n').trim();
      }

      commentary[segment] = text.replace(/^\s*\w+\s*:\s*/i,'').trim();
    }

    const timestamps = [
      { segment: 'introduction', start: 0, end: 30 },
      { segment: 'key_batting', start: 30, end: 90 },
      { segment: 'turning_points', start: 90, end: 120 },
      { segment: 'final_analysis', start: 120, end: 150 },
      { segment: 'player_of_match', start: 150, end: 180 },
    ];

    return { match: matchContext, commentaryScript: { commentary, timestamps } };

  } catch (error) {
    console.error('Error generating commentary:', error);

    // fallback
    return {
      match: JSON.stringify(matchData),
      commentaryScript: {
        commentary: {
          introduction: `Exciting match between ${matchData.team1 || 'Team A'} and ${matchData.team2 || 'Team B'}`,
          key_batting: 'Outstanding batting performances throughout the match',
          turning_points: "Several crucial moments changed the game's momentum",
          final_analysis: 'A well-fought match with impressive skill',
          player_of_match: 'Exceptional individual performances stood out',
        },
        timestamps: [
          { segment: 'introduction', start: 0, end: 30 },
          { segment: 'key_batting', start: 30, end: 90 },
          { segment: 'turning_points', start: 90, end: 120 },
          { segment: 'final_analysis', start: 120, end: 150 },
          { segment: 'player_of_match', start: 150, end: 180 },
        ],
      }
    };
  }
};

module.exports = { generateCommentary };
