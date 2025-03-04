require('dotenv').config();
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const { google } = require('googleapis');
const ffmpeg = require('ffmpeg-static');
const { spawn } = require('child_process');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const path = require('path');
const { PassThrough } = require('stream');

// Initialize YouTube API
const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song from YouTube')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Song name or YouTube URL')
                .setRequired(true)
        ),

    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            return interaction.reply({ content: 'You must be in a voice channel to use this command!', ephemeral: true });
        }

        const botPermissions = voiceChannel.permissionsFor(interaction.client.user);
        if (!botPermissions.has(PermissionFlagsBits.Connect)) {
            return interaction.reply({ content: 'I don\'t have permission to connect to this voice channel!', ephemeral: true });
        }
        if (!botPermissions.has(PermissionFlagsBits.Speak)) {
            return interaction.reply({ content: 'I don\'t have permission to speak in this voice channel!', ephemeral: true });
        }

        const query = interaction.options.getString('query');

        try {
            await interaction.deferReply();

            let videoUrl;
            if (query.includes('youtube.com') || query.includes('youtu.be')) {
                videoUrl = query;
            } else {
                // Search for video using YouTube API
                const response = await youtube.search.list({
                    part: 'snippet',
                    q: query,
                    type: 'video',
                    maxResults: 1
                });

                if (!response.data.items || response.data.items.length === 0) {
                    return interaction.editReply('No results found.');
                }

                videoUrl = `https://www.youtube.com/watch?v=${response.data.items[0].id.videoId}`;
            }

            console.log('Joining voice channel...');
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator
            });

            console.log('Creating audio player...');
            const player = createAudioPlayer();

            console.log('Subscribing player to connection...');
            connection.subscribe(player);

            // Log connection state changes for debugging
            connection.on('stateChange', (oldState, newState) => {
                console.log(`Connection state changed from ${oldState.status} to ${newState.status}`);
            });

            console.log('Getting video info...');
            const ytDlpPath = path.join(__dirname, '..', '..', 'bin', 'yt-dlp.exe');
            console.log('yt-dlp path:', ytDlpPath);
            const { stdout: videoInfo } = await execAsync(`"${ytDlpPath}" -f "bestaudio[ext=m4a]" -g "${videoUrl}"`);
            const streamUrl = videoInfo.trim();
            console.log('Stream URL:', streamUrl);

            console.log('Setting up FFmpeg process...');
            // FFmpeg command with additional reconnect options and output to Ogg container
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
                'pipe:1',
            
             
            ]);

            // Log FFmpeg errors
            ffmpegProcess.stderr.on('data', (data) => {
                console.error('FFmpeg error:', data.toString());
            });

            // Create a PassThrough stream for buffering
            const bufferStream = new PassThrough();
            ffmpegProcess.stdout.pipe(bufferStream);

            console.log('Creating audio resource...');
            const resource = createAudioResource(bufferStream, {
                inputType: 'ogg/opus',
                inlineVolume: true,
                metadata: { title: query },
                silencePaddingFrames: 0,
                seek: 0,
                volume: 1,
                inputBufferSize: 1024 * 1024, // 1MB buffer
                inputBufferTime: 1000, // 1 second buffer
                outputBufferSize: 1024 * 1024, // 1MB buffer
                outputBufferTime: 1000 // 1 second buffer
            });

            // Set volume to 100%
            resource.volume?.setVolume(1);

            // Handle FFmpeg process errors
            ffmpegProcess.on('error', (error) => {
                console.error('FFmpeg process error:', error);
            });

            ffmpegProcess.on('close', (code) => {
                console.log(`FFmpeg process exited with code ${code}`);
            });

            console.log('Starting playback...');
            player.play(resource);

            // Handle disconnection
            connection.on(VoiceConnectionStatus.Disconnected, async () => {
                console.log('Voice connection disconnected');
                try {
                    await connection.destroy();
                    ffmpegProcess.kill();
                } catch (error) {
                    console.error('Error destroying connection:', error);
                }
            });

            // Clean up after playback finishes
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

            // Handle player errors
            player.on('error', async (error) => {
                console.error('Audio player error:', error);
                try {
                    if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                        connection.destroy();
                    }
                    ffmpegProcess.kill();
                    await interaction.editReply(`❌ Error playing video: ${error.message}`);
                } catch (destroyError) {
                    console.error('Error destroying connection:', destroyError);
                }
            });

            await interaction.editReply(`Now Playing: **[${query}](${videoUrl})**`);
        } catch (error) {
            console.error('Error executing command:', error);
            await interaction.editReply('An error occurred while executing the command.');
        }
    }
};
