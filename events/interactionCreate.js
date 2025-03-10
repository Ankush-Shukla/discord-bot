module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    // ✅ Handle Autocomplete Queries
    if (interaction.isAutocomplete()) {
      const autocompleteHandler = require('../services/autocomplete.js');
      return autocompleteHandler.execute(interaction);
    }

    // ✅ Handle Select Menu Interactions
    if (interaction.isStringSelectMenu() && interaction.customId === 'song_select') {
      // 🔥 Fix: Use deferReply() instead of deferUpdate()
      await interaction.deferReply();

      const selectedSongUrl = interaction.values[0];
      const playCommand = require('../commands/entertainment/play.js');

      try {
        await playCommand.playSong(interaction, selectedSongUrl, selectedSongUrl);
      } catch (error) {
        console.error('Error playing song from select menu:', error);
        await interaction.followUp({ content: '❌ There was an error playing your selected song.', ephemeral: true });
      }
      return;
    }

    // ✅ Handle Slash Commands Normally
    if (!interaction.isCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error('Command execution error:', error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: '❌ There was an error executing this command!', ephemeral: true });
      } else {
        await interaction.reply({ content: '❌ There was an error executing this command!', ephemeral: true });
      }
    }
  }
};
