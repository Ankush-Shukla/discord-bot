module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
      if (interaction.isAutocomplete()) {
      
        const autocompleteHandler = require('../services/autocomplete.js');
        return autocompleteHandler.execute(interaction);
      }
      if (!interaction.isCommand()) return;
      
      const command = interaction.client.commands.get(interaction.commandName);
      const response = await youtube.search.list({
        part: 'snippet',
        q: focusedValue,
        type: 'video',
        maxResults: 10,
        videoCategoryId: '10', // 🔥 Restricts search to music videos
        topicId: '/m/04rlf',   // 🎵 Filters for music-related videos
        order: 'viewCount'     // 📊 Sort by highest views
    });
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
    },
  };