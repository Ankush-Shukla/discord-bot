const { google } = require('googleapis');
const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isAutocomplete()) return;

        const focusedValue = interaction.options.getFocused();

        try {
            // Search YouTube for videos matching the input
            const response = await youtube.search.list({
                part: 'snippet',
                q: focusedValue,
                type: 'video',
                maxResults: 10,
                videoCategoryId: '10', // 🔥 Restricts search to music videos
                topicId: '/m/04rlf',   // 🎵 Filters for music-related videos
                order: 'viewCount'     // 📊 Sort by highest views
            });
            const maxChoiceLength = 100;
            // Format the results as choices, trimming long names
            const choices = response.data.items.map(video => {
                let name = `${video.snippet.title} [${video.snippet.channelTitle}]`;
                if (name.length > maxChoiceLength) {
                    name = name.substring(0, maxChoiceLength - 3) + '...';
                }
                return {
                    name,
                    value: `https://www.youtube.com/watch?v=${video.id.videoId}`
                };
            });

            await interaction.respond(choices);
        } catch (error) {
            console.error('YouTube API Error:', error);
            await interaction.respond([]);
        }
    }
};
