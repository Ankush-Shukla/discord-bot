require('dotenv').config();
const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const { google } = require('googleapis');
const ffmpeg = require('ffmpeg-static');
const { spawn } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(require('child_process').exec);
const path = require('path');
const { PassThrough } = require('stream');

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

// Playback helper function: join VC, get stream URL via yt-dlp, pipe through FFmpeg, and play.
async function playSong(interaction, videoUrl, query) {
  const voiceChannel = interaction.member.voice.channel;
  if (!voiceChannel) {
    return interaction.reply({ content: 'You must be in a voice channel!', ephemeral: true });
  }
  const botPermissions = voiceChannel.permissionsFor(interaction.client.user);
  if (!botPermissions.has(PermissionFlagsBits.Connect) || !botPermissions.has(PermissionFlagsBits.Speak)) {
    return interaction.reply({ content: 'I need permissions to join and speak in the voice channel!', ephemeral: true });
  }

  // Join the voice channel
  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: interaction.guildId,
    adapterCreator: interaction.guild.voiceAdapterCreator
  });
  console.log('Joining voice channel...');
  const player = createAudioPlayer();
  connection.subscribe(player);
  connection.on('stateChange', (oldState, newState) => {
    console.log(`Connection state changed from ${oldState.status} to ${newState.status}`);
  });

  // Retrieve stream URL via yt-dlp (using bestaudio format)
  const ytDlpPath = path.join(__dirname, '..', '..', 'bin', 'yt-dlp.exe');
  console.log('yt-dlp path:', ytDlpPath);
  const { stdout: videoInfo } = await execAsync(`"${ytDlpPath}" -f "bestaudio[ext=m4a]" -g "${videoUrl}"`);
  const streamUrl = videoInfo.trim();
  console.log('Stream URL:', streamUrl);

  // Set up FFmpeg to convert the stream for Discord.
  // You can experiment with '-analyzeduration' and '-probesize' to improve stability.
  const ffmpegProcess = spawn(ffmpeg, [
    '-reconnect', '1',
    '-reconnect_streamed', '1',
    '-reconnect_delay_max', '5',
    '-i', streamUrl,
    '-analyzeduration', '0',
    '-loglevel', '0',
    '-ac', '2',
    '-ar', '48000',
    '-acodec', 'libopus',
    '-f', 'ogg',
    'pipe:1'
  ]);

  ffmpegProcess.stderr.on('data', (data) => {
    console.error('FFmpeg error:', data.toString());
  });

  const bufferStream = new PassThrough();
  ffmpegProcess.stdout.pipe(bufferStream);

  const resource = createAudioResource(bufferStream, {
    inputType: 'ogg/opus',
    inlineVolume: true,
    metadata: { title: query },
    silencePaddingFrames: 0
  });
  resource.volume?.setVolume(1);

  ffmpegProcess.on('error', (error) => {
    console.error('FFmpeg process error:', error);
  });
  ffmpegProcess.on('close', (code) => {
    console.log(`FFmpeg process exited with code ${code}`);
  });

  console.log('Starting playback...');
  player.play(resource);

  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    console.log('Voice connection disconnected');
    try {
      await connection.destroy();
      ffmpegProcess.kill();
    } catch (error) {
      console.error('Error destroying connection:', error);
    }
  });

  player.on(AudioPlayerStatus.Idle, () => {
    console.log('Audio player idle');
    try {
      if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
        connection.destroy();
      }
      ffmpegProcess.kill();
    } catch (error) {
      console.error('Error on idle:', error);
    }
  });

  player.on('error', async (error) => {
    console.error('Audio player error:', error);
    try {
      if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
        connection.destroy();
      }
      ffmpegProcess.kill();
      await interaction.followUp(`❌ Error playing video: ${error.message}`);
    } catch (destroyError) {
      console.error('Error destroying connection:', destroyError);
    }
  });

  // Use followUp if the interaction is already deferred or replied.
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(`Now Playing: **[${query}](${videoUrl})**`);
  } else {
    await interaction.editReply(`Now Playing: **[${query}](${videoUrl})**`);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song from YouTube')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Song name or YouTube URL')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  // Command execution
  async execute(interaction) {
    const query = interaction.options.getString('query');

    // If the query is a direct YouTube URL, play immediately.
    if (query.includes('youtube.com') || query.includes('youtu.be')) {
      await interaction.deferReply();
      return playSong(interaction, query, query);
    }

    // Otherwise, search for music videos and present a select menu.
    try {
      await interaction.deferReply();
      const response = await youtube.search.list({
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: 5,
        videoCategoryId: '10',  // Restrict to music videos
        topicId: '/m/04rlf',    // Music-related
        order: 'viewCount'      // Sort by highest views
      });

      if (!response.data.items.length) {
        return interaction.editReply('No results found.');
      }

      const options = response.data.items.map(item => ({
        label: item.snippet.title.length > 100 ? item.snippet.title.substring(0, 97) + '...' : item.snippet.title,
        description: item.snippet.channelTitle.length > 100 ? item.snippet.channelTitle.substring(0, 97) + '...' : item.snippet.channelTitle,
        value: `https://www.youtube.com/watch?v=${item.id.videoId}`
      }));

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('song_select')
        .setPlaceholder('Choose a song')
        .addOptions(options);

      const row = new ActionRowBuilder().addComponents(selectMenu);
      return interaction.editReply({ content: 'Select a song:', components: [row] });
    } catch (error) {
      console.error('Error searching for songs:', error);
      await interaction.editReply('An error occurred while searching.');
    }
  },

  playSong // Export the helper function so it can be used in the select menu handler.
};
