
const { SlashCommandBuilder } = require('discord.js');
const { getYouTubeVideoDetails } = require('../../utils/YoutubeDetails');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause or resume the current song'),

  async execute(interaction) {

    if (!interaction.guild) {
      return interaction.reply({ content: '❌ This command can only be used in a server.', ephemeral: false });
    }

    const queue = interaction.client.queueMap.get(interaction.guildId);
    if (!queue || queue.songs.length === 0) {
      return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: flase});
    }

    // Defer reply before any async operation
    await interaction.deferReply({ ephemeral: false});

    const player = queue.player;
    const song = queue.songs[0];

    // Fetch song details (title)
    let title = 'Unknown Song';
    try {
      const details = await getYouTubeVideoDetails(song.url);
      title = details.title || title;
    } catch (err) {
      console.warn('Could not fetch video title:', err);
    }

    // Toggle pause/resume
    if (queue.isPaused) {
      player.unpause();
      queue.isPaused = false;
      await interaction.editReply(` **${interaction.member.displayName}** Resumed: **${title}**`);
    } else {
      player.pause();
      queue.isPaused = true;
    await interaction.editReply(` **${interaction.memebr.displayName}** Paused: **${title}**`);
    }
  }
};
