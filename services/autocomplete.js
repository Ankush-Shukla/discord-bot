const { google } = require('googleapis');
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

module.exports = {
  async execute(interaction) {
    if (!interaction.isAutocomplete()) return;

    const query = interaction.options.getFocused();

    if (!query || query.length < 3) {
      try {
        return await interaction.respond([]); // respond fast to prevent 10062
      } catch (err) {
        return;
      }
    }

    // Timeout guard (respond at 2800ms even if search is slow)
    let responded = false;
    const timeout = setTimeout(async () => {
      if (!responded) {
        responded = true;
        try { await interaction.respond([]); } catch (_) {}
      }
    }, 2800); // < 3s (Discord limit)

    try {
      const res = await youtube.search.list({
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: 5
      });

      if (responded) return; // too late

      const choices = res.data.items.map(item => ({
        name: item.snippet.title.slice(0, 100),
        value: `https://www.youtube.com/watch?v=${item.id.videoId}`
      }));

      clearTimeout(timeout);
      responded = true;
      await interaction.respond(choices);

    } catch (err) {
      console.error('❌ Autocomplete Error:', err.message);
      if (!responded) {
        try {
          await interaction.respond([]);
        } catch (_) {}
      }
    }
  }
};
