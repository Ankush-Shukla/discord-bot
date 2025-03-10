const { google } = require('googleapis');
const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isAutocomplete()) return;

        const query = interaction.options.getFocused();
        
        // Prevent API spam: Only search if the query is 3+ characters
        if (!query || query.length < 3) return interaction.respond([]);

        try {
            const response = await youtube.search.list({
                part: 'snippet',
                q: query,
                type: 'video',
                maxResults: 5,
                videoCategoryId: '10',
                topicId: '/m/04rlf',
                order: 'viewCount'
            });

            if (!response.data.items.length) return interaction.respond([]);

            const choices = response.data.items.map(video => ({
                name: video.snippet.title.substring(0, 100),
                value: `https://www.youtube.com/watch?v=${video.id.videoId}`
            }));

            await interaction.respond(choices);
        } catch (error) {
            console.error('YouTube API Error:', error);
            await interaction.respond([]);
        }
    }
};
