// commands/entertainment/pause.js
const { SlashCommandBuilder } = require('discord.js');
const { queueMap } = require('./play');
const { getYouTubeVideoDetails } = require('../../utils/YoutubeDetails');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause or resume the current song'),

  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({ content: '❌ This command can only be used in a server.', ephemeral: true });
    }

    const queue = queueMap.get(interaction.guildId);
    if (!queue || queue.songs.length === 0) {
      return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });
    }

    const player = queue.player;
    const song = queue.songs[0];

    // Fetch song details (title, etc.)
    let title = 'Unknown Song';
    try {
      const details = await getYouTubeVideoDetails(song.url);
      title = details.title || title;
    } catch (err) {
      console.warn('Could not fetch video title:', err);
    }

    if (queue.isPaused) {
      player.unpause();
      queue.isPaused = false;
      return interaction.reply(`▶️ Resumed: **${title}**`);
    } else {
      player.pause();
      queue.isPaused = true;
      return interaction.reply(`⏸️ Paused: **${title}**`);
    }
  }
};
