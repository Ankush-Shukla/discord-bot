require('dotenv').config();
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const path = require('path');

const ytDlpPath = "D:\\GitProjects\\Chotu\\bin\\yt-dlp.exe";// Ensure correct path

/**
 * Fetches YouTube video details (title, duration, author, thumbnail) using yt-dlp.
 * @param {string} videoUrl - The full YouTube video URL.
 * @returns {Promise<{title: string, duration: string, author: string, thumbnail: string}>} - Video details.
 */
async function getYouTubeVideoDetails(videoUrl) {
  try {
    // Execute yt-dlp command to fetch metadata
    const { stdout } = await execAsync(`"${ytDlpPath}" --no-warnings -J "${videoUrl}"`);
    
    // Parse JSON output
    const videoData = JSON.parse(stdout);

    const title = videoData.title || 'Unknown';
    const author = videoData.uploader || 'Unknown';
    const duration = formatDuration(videoData.duration || 0); // Convert seconds to mm:ss
    const thumbnail = videoData.thumbnail || ''; // Use the highest quality available

    return { title, duration, author, thumbnail };
  } catch (error) {
    console.error('Error fetching video details:', error);
    return { title: 'Unknown', duration: 'Unknown', author: 'Unknown', thumbnail: '' };
  }
}

/**
 * Converts duration in seconds to mm:ss or hh:mm:ss format.
 * @param {number} seconds - Duration in seconds.
 * @returns {string} - Formatted duration.
 */
function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` 
               : `${m}:${s.toString().padStart(2, '0')}`;
}

module.exports = { getYouTubeVideoDetails };
