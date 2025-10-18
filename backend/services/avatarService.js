// backend/services/avatarService.js
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
const BASE_URL = "https://api.heygen.com";

if (!HEYGEN_API_KEY) throw new Error("HEYGEN_API_KEY is not found");

const headers = {
  accept: "application/json",
  "x-api-key": HEYGEN_API_KEY,
};

const getFirstAvatarId = async () => {
  const { data } = await axios.get(`${BASE_URL}/v2/avatars`, { headers });
  const avatar = data?.data?.avatars?.[0];
  console.log("Using avatar:", avatar?.avatar_id, "-", avatar?.name);
  return avatar?.avatar_id;
};


const getFirstVoiceId = async () => {
  const { data } = await axios.get(`${BASE_URL}/v2/voices`, { headers });
  const voice = data?.data?.voices?.[0];
  console.log("Using voice:", voice?.voice_id, "-", voice?.name);
  return voice?.voice_id;
};


const createHeyGenVideo = async (scriptSegment, avatarId, voiceId) => {
  try {
    console.log(`Generating video for segment: ${scriptSegment.segment}`);

    const payload = {
      caption: false,
      dimension: { width: 1280, height: 720 },
      video_inputs: [
        {
          character: { type: "avatar", avatar_id: avatarId, avatar_style: "normal" },
          voice: { type: "text", input_text: scriptSegment.text, voice_id: voiceId },
          background: { type: "color", value: "#000000" },
          // background: { type: "transparent" },
        },
      ],
    };

    const { data } = await axios.post(`${BASE_URL}/v2/video/generate`, payload, {
      headers: { ...headers, "Content-Type": "application/json" },
    });

    console.log("Video generation started:", data);
    return data;
  } catch (error) {
    console.error("HeyGen API error:", error.response?.data || error.message);
    throw new Error(`HeyGen API failed: ${error.message}`);
  }
};

// ✅ Poll until video completes
const waitForVideoCompletion = async (videoId) => {
  let attempts = 0;
  const maxAttempts = 100;

  console.log(`Waiting for video completion... [ID: ${videoId}]`);

  return new Promise((resolve, reject) => {
    const checkStatus = async () => {
      attempts++;
      try {
        const { data } = await axios.get(`${BASE_URL}/v1/video_status.get?video_id=${videoId}`, {
          headers,
        });

        const status = data?.data?.status;
        console.log(`Status check ${attempts}/${maxAttempts}:`, status);

        if (status === "completed") {
          console.log("Video completed:", data.data.video_url);
          resolve(data.data.video_url);
        } else if (status === "failed") {
          reject(new Error("Video generation failed"));
        } else if (attempts >= maxAttempts) {
          reject(new Error("Timeout waiting for video completion"));
        } else {
          setTimeout(checkStatus, 50000);
        }
      } catch (err) {
        console.error(`Error checking status:`, err.response?.data || err.message);
        if (attempts >= maxAttempts) reject(err);
        else setTimeout(checkStatus, 50000);
      }
    };
    checkStatus();
  });
};


const downloadVideo = async (videoUrl, segmentName) => {
  const response = await axios.get(videoUrl, { responseType: "arraybuffer" });
  const buffer = response.data;

  const tempDir = path.join(process.cwd(), "temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const filename = `avatar_${segmentName}_${Date.now()}.mp4`;
  const filepath = path.join(tempDir, filename);

  fs.writeFileSync(filepath, Buffer.from(buffer));
  console.log(`Saved video: ${filepath}`);

  return filepath;
};

const createAvatarVideo = async (commentaryScript) => {
  const avatarId = await getFirstAvatarId();
  const voiceId = await getFirstVoiceId();

  if (!avatarId || !voiceId) throw new Error("No avatars or voices available");

  const videoSegments = [];
  const segmentsToProcess = commentaryScript.timestamps; //.slice[:2]

  for (const timestamp of segmentsToProcess) {
    const text = commentaryScript.commentary[timestamp.segment];
    if (!text) continue;

    const videoData = await createHeyGenVideo({ text, segment: timestamp.segment }, avatarId, voiceId);
    const videoUrl = await waitForVideoCompletion(videoData.data.video_id);
    const localPath = await downloadVideo(videoUrl, timestamp.segment);

    videoSegments.push({ path: localPath, segment: timestamp.segment });
  }

  return videoSegments;
};

module.exports = { 
    createAvatarVideo
};