const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { info } = require('../../utils/embeds');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Lists all available commands'),
  
  async execute(interaction) {
    const commandFolders = fs.readdirSync(path.join(__dirname, '../'));
    
    const categories = commandFolders.map(folder => {
      return {
        label: folder.charAt(0).toUpperCase() + folder.slice(1),
        value: folder,
        description: `${folder.charAt(0).toUpperCase() + folder.slice(1)} commands`
      };
    });
    
    const row = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('help-menu')
          .setPlaceholder('Select a category')
          .addOptions(categories)
      );
    
    const initialEmbed = info(
      'Help Menu', 
      'Select a category from the dropdown menu below to see available commands.'
    );
    
    const response = await interaction.reply({
      embeds: [initialEmbed],
      components: [row],
      ephemeral: true
    });
    
    // Create collector for menu interaction
    const collector = response.createMessageComponentCollector({ 
      time: 60000 
    });
    
    collector.on('collect', async i => {
      if (i.customId === 'help-menu') {
        const selectedCategory = i.values[0];
        
        // Get commands from the selected category
        const commandFiles = fs.readdirSync(path.join(__dirname, '../', selectedCategory))
          .filter(file => file.endsWith('.js'));
          
        const commandsInfo = commandFiles.map(file => {
          const command = require(path.join(__dirname, '../', selectedCategory, file));
          return `**/${command.data.name}** - ${command.data.description}`;
        });
        
        const categoryEmbed = info(
          `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Commands`,
          commandsInfo.join('\n\n')
        );
        
        await i.update({ embeds: [categoryEmbed], components: [row] });
      }
    });
    
    collector.on('end', () => {
      interaction.editReply({ 
        components: [] 
      }).catch(error => console.error('Failed to update message:', error));
    });
  },
};