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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song from YouTube')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Song name or YouTube URL')
                .setRequired(true)
                .setAutocomplete(true)  // ✅ Keep this
        ),
        async autocomplete(interaction) {
            const focusedValue = interaction.options.getFocused();
            if (!focusedValue) return;
    
            try {
                const response = await youtube.search.list({
                    part: 'snippet',
                    q: focusedValue,
                    type: 'video',
                    maxResults: 10,
                    videoCategoryId: '10', // 🔥 Restricts search to music videos
                    topicId: '/m/04rlf',   // 🎵 Filters for music-related videos
                    order: 'viewCount'     // 📊 Sort by highest views
                });
    
                const results = response.data.items.map(video => ({
                    name: video.snippet.title,
                    value: `https://www.youtube.com/watch?v=${video.id.videoId}`
                }));
    
                await interaction.respond(results);
            } catch (error) {
                console.error('Autocomplete error:', error);
                await interaction.respond([]);
            }
        },

    async execute(interaction) {
        const query = interaction.options.getString('query');
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            return interaction.reply({ content: 'You must be in a voice channel!', ephemeral: true });
        }

        const botPermissions = voiceChannel.permissionsFor(interaction.client.user);
        if (!botPermissions.has(PermissionFlagsBits.Connect) || !botPermissions.has(PermissionFlagsBits.Speak)) {
            return interaction.reply({ content: 'I need permissions to join and speak in the voice channel!', ephemeral: true });
        }

        await interaction.deferReply();

        try {
            let videoUrl;
            if (query.includes('youtube.com') || query.includes('youtu.be')) {
                videoUrl = query;
            } else {
                const response = await youtube.search.list({
                    part: 'snippet',
                    q: query,
                    type: 'video',
                    maxResults: 5
                });

                if (!response.data.items.length) {
                    return interaction.editReply('No results found.');
                }

                const options = response.data.items.map((item, index) => ({
                    label: item.snippet.title,
                    description: item.snippet.channelTitle,
                    value: `https://www.youtube.com/watch?v=${item.id.videoId}`
                }));

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('song_select')
                    .setPlaceholder('Choose a song')
                    .addOptions(options);

                const row = new ActionRowBuilder().addComponents(selectMenu);
                return interaction.editReply({ content: 'Select a song:', components: [row] });
            }

        } catch (error) {
            console.error('Error:', error);
            await interaction.editReply('An error occurred while searching.');
        }
    }
};
