module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    // ✅ Handle Autocomplete Interactions
    if (interaction.isAutocomplete()) {
      const autocompleteHandler = require('../services/autocomplete.js');
      return autocompleteHandler.execute(interaction);
    }

    // ✅ Handle Select Menu Interactions
    if (interaction.isStringSelectMenu() && interaction.customId === 'song_select') {
      await interaction.deferReply();
      const selectedSongUrl = interaction.values[0];
      const playCommand = require('../commands/entertainment/play.js');

      try {
        await playCommand.playSong(interaction, selectedSongUrl, selectedSongUrl);
      } catch (error) {
        console.error('Error playing selected song:', error);
        await interaction.followUp({ content: '❌ Failed to play the selected song.', ephemeral: true });
      }
      return;
    }

    // ✅ Handle Slash Commands
    if (!interaction.isCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
      console.error(`❌ No command found for: ${interaction.commandName}`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error('Slash command execution error:', error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: '❌ Command failed to execute.', ephemeral: true });
      } else {
        await interaction.reply({ content: '❌ Command failed to execute.', ephemeral: true });
      }
    }
  }
};
