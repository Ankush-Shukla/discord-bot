require('dotenv').config();
const util = require('util');
const path = require('path');
const { exec } = require('child_process');
const execAsync = util.promisify(exec);

// Dynamically resolve yt-dlp binary (handles Linux, macOS, Windows)
const ytDlpPath = "yt-dlp"

/**
 * Converts seconds to hh:mm:ss or mm:ss format.
 */
function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0
    ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    : `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Gets YouTube video details using yt-dlp.
 */
async function getYouTubeVideoDetails(videoUrl) {
  try {
    if (!videoUrl || typeof videoUrl !== 'string') {
      throw new Error('Invalid video URL');
    }

    const command = `"${ytDlpPath}" --no-warnings -J "${videoUrl}"`;
    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      console.warn('yt-dlp stderr:', stderr);
    }

    const videoData = JSON.parse(stdout);

    return {
      title: videoData.title || 'Unknown',
      author: videoData.uploader || 'Unknown',
      duration: formatDuration(videoData.duration || 0),
      thumbnail: videoData.thumbnail || ''
    };
  } catch (error) {
    console.error('❌ yt-dlp Error ->', error.message);
    return {
      title: 'Unknown',
      author: 'Unknown',
      duration: '0:00',
      thumbnail: ''
    };
  }
}

module.exports = { getYouTubeVideoDetails };
