const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const composeFinalVideo = async (avatarVideos, chartSegments) => {
    const outputDir = path.join(process.cwd(), 'backend', 'temp');

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const timestamp = Date.now();
    const finalOutputPath = path.join(outputDir, `final_${timestamp}.mp4`);

    const overlaidClips = [];
    const tempFiles = [];

    try {        
        for (let i = 0; i < avatarVideos.length; i++) {
            const avatar = path.join(process.cwd(), avatarVideos[i].path);
            const chart = path.join(process.cwd(), chartSegments[i].path);

            if (!fs.existsSync(avatar)) {
                console.warn(`Skipping avatar segment ${i} (file not found)`);
                continue;
            }
            if (!fs.existsSync(chart)) {
                console.warn(`Skipping chart segment ${i} (file not found)`);
                continue;
            }

            const tempOverlay = path.join(outputDir, `overlay_${i}_${timestamp}.mp4`);
            overlaidClips.push(tempOverlay);
            tempFiles.push(tempOverlay);

            const avatarDuration = await new Promise((resolve, reject) => {
                ffmpeg.ffprobe(avatar, (err, metadata) => {
                    if (err) return reject(new Error(`Failed to analyze avatar video: ${err.message}`));
                    if (!metadata.format?.duration) return reject(new Error('Could not determine avatar video duration'));
                    resolve(metadata.format.duration);
                });
            });

            await new Promise((resolve, reject) => {
                ffmpeg()
                    .input(chart)
                    .inputOptions(['-stream_loop', '-1'])
                    .input(avatar)
                    .complexFilter([
                        { filter: 'scale', options: '1280:720', inputs: '[0:v]', outputs: 'bg' },
                        { filter: 'scale', options: '320:180', inputs: '[1:v]', outputs: 'avatar_scaled' },
                        { filter: 'overlay', options: { x: 10, y: 530 }, inputs: ['bg', 'avatar_scaled'], outputs: 'final' }
                    ])
                    .outputOptions(['-map', '[final]', '-map', '1:a?', '-c:v', 'libx264', '-c:a', 'aac', '-shortest', '-y'])
                    .duration(avatarDuration)
                    .output(tempOverlay)
                    .on('start', commandLine => console.log('FFmpeg command:', commandLine))
                    .on('end', () => {
                        console.log(`Overlay video created: ${tempOverlay}`);
                        resolve();
                    })
                    .on('error', err => reject(new Error(`FFmpeg overlay error: ${err.message}`)))
                    .run();
            });

            if (!fs.existsSync(tempOverlay)) {
                throw new Error(`Overlay video not created: ${tempOverlay}`);
            }
        }

        if (overlaidClips.length === 0) throw new Error('No overlay clips were generated');

        console.log('\nConcatenating all overlay clips into final video...');
        const fileListPath = path.join(outputDir, `filelist_${timestamp}.txt`);
        tempFiles.push(fileListPath);

        const fileListContent = overlaidClips.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n');
        fs.writeFileSync(fileListPath, fileListContent);

        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(fileListPath)
                .inputOptions(['-f', 'concat', '-safe', '0'])
                .outputOptions(['-c', 'copy', '-y'])
                .output(finalOutputPath)
                .on('start', commandLine => console.log('FFmpeg concat command:', commandLine))
                .on('end', () => {
                    console.log(`Final video created: ${finalOutputPath}`);
                    resolve();
                })
                .on('error', err => reject(new Error(`FFmpeg concat error: ${err.message}`)))
                .run();
        });

        if (!fs.existsSync(finalOutputPath)) {
            throw new Error(`Final output file not found: ${finalOutputPath}`);
        }

        return finalOutputPath;

    } catch (error) {
        console.error('Error generating video:', error.message);
        throw error;
    } finally {
        tempFiles.forEach(file => {
            // delete temp files
            try { if (fs.existsSync(file)) fs.unlinkSync(file); } 
            catch (err) { console.warn(`Failed to delete temp file: ${err.message}`); }
        });
    }
};

module.exports = { composeFinalVideo };