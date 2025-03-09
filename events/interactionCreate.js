module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    // If it's an autocomplete, handle it in your autocomplete service.
    if (interaction.isAutocomplete()) {
      const autocompleteHandler = require('../services/autocomplete.js');
      return autocompleteHandler.execute(interaction);
    }

    // Handle select menu interactions
    if (interaction.isStringSelectMenu() && interaction.customId === 'song_select') {
      // Defer update to acknowledge the select menu interaction.
      await interaction.deferUpdate();
      const selectedSongUrl = interaction.values[0];
      // Use the playSong helper from play.js
      const playCommand = require('../commands/entertainment/play.js');
      try {
        await playCommand.playSong(interaction, selectedSongUrl, selectedSongUrl);
      } catch (error) {
        console.error('Error playing song from select menu:', error);
        await interaction.followUp({ content: 'There was an error playing your selected song.', ephemeral: true });
      }
      return;
    }

    // If it's a normal command, handle it normally.
    if (!interaction.isCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error executing this command!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
      }
    }
  }
};
