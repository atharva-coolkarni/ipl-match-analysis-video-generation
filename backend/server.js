// backend/server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { generateCommentary } = require('./services/geminiService');
const { createAvatarVideo } = require('./services/avatarService');
const { generatePresentationSegments } = require('./services/chartService');
const { composeFinalVideo } = require('./services/videoService');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('temp'));

const loadMatchData = (year) => {
    try {
        const filePath = path.join(__dirname, 'data', `ipl_${year}.json`);
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        return null;
    }
};

app.get('/api/years', (req, res) => {
    const years = [];
    for (let year = 2008; year <= 2024; year++) {
        if (fs.existsSync(path.join(__dirname, 'data', `ipl_${year}.json`))) {
            years.push(year);
        }
    }
    res.json(years);
});



app.get('/api/teams/:year', (req, res) => {
    const { year } = req.params;
    const data = loadMatchData(year);
    
    if (!data) {
        return res.status(404).json({ error: 'Year not found' });
    }

    const teams = new Set();
    data.forEach(match => {
        match.teams.forEach(team => teams.add(team));
    });
    
    res.json(Array.from(teams));
});


app.post('/api/generate-video', async (req, res) => {
    const { year, team1, team2 } = req.body;    
    
    try {


        const data = loadMatchData(year);
        if (!data) {
            return res.status(404).json({ error: 'Year not found' });
        }

        const match = data.find(m => 
            m.teams.includes(team1) && m.teams.includes(team2)
        );

        if (!match) {
            return res.status(404).json({ error: 'Match not found' });
        }

        // Generate commentary script
        
        console.log('Generating commentary script');
        const {matchData, commentaryScript} = await generateCommentary(req.body);
        
        // Generate charts
        console.log('Generating charts');
        // const chartSegments = await generateCharts(match);
        const chartSegments = await generatePresentationSegments(match, commentaryScript);

        // chartSegments=[
        //         { path: "backend/temp/introduction.mp4", segment: "introduction" },
        //         { path: "backend/temp/key_batting.mp4", segment: "key_batting" },
        //         { path: "backend/temp/turning_points.mp4", segment: "turning_points" },
        //         { path: "backend/temp/player_of_match.mp4", segment: "player_of_match" },
        //         { path: "backend/temp/final_analysis.mp4", segment: "final_analysis" }
        //         ];

        // // Create avatar videos
        console.log('Creating avatar videos');
        const avatarVideos = await createAvatarVideo(commentaryScript);
        
        // avatarVideos=[
        //         { path: "backend/temp/avatar_introduction_1760768172243.mp4", segment: "introduction" },
        //         { path: "backend/temp/avatar_key_batting_1760768696591.mp4", segment: "key_batting" },
        //         { path: "backend/temp/avatar_turning_points_1760768960596.mp4", segment: "turning_points" },
        //         { path: "backend/temp/avatar_player_of_match_1760769904957.mp4", segment: "player_of_match" },
        //         { path: "backend/temp/avatar_final_analysis_1760769427571.mp4", segment: "final_analysis" }
        //         ];

        // Compose final video
        console.log('Composing final video');
        const finalVideoPath = await composeFinalVideo(avatarVideos, chartSegments);
        
        res.json({ 
            success: true, 
            videoUrl: `/videos/${path.basename(finalVideoPath)}`,
            matchId: `${year}_${team1}_vs_${team2}`
        });

    } catch (error) {
        console.error('Error generating video:', error);
        res.status(500).json({ error: 'Failed to generate video' });
    }
});


app.use('/videos', express.static(path.join(__dirname, 'temp')));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});