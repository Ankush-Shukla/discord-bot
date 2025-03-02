const { EmbedBuilder } = require('discord.js');

module.exports = {
  // Standard success embed
  success: (title, description) => {
    return new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle(title)
      .setDescription(description)
      .setTimestamp();
  },
  
  // Error embed
  error: (title, description) => {
    return new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle(title)
      .setDescription(description)
      .setTimestamp();
  },
  
  // Info embed
  info: (title, description) => {
    return new EmbedBuilder()
      .setColor('#0099FF')
      .setTitle(title)
      .setDescription(description)
      .setTimestamp();
  },
  
  // Custom embed with more options
  custom: (options) => {
    const embed = new EmbedBuilder()
      .setColor(options.color || '#0099FF')
      .setTimestamp();
      
    if (options.title) embed.setTitle(options.title);
    if (options.description) embed.setDescription(options.description);
    if (options.thumbnail) embed.setThumbnail(options.thumbnail);
    if (options.image) embed.setImage(options.image);
    if (options.author) embed.setAuthor(options.author);
    if (options.footer) embed.setFooter(options.footer);
    if (options.fields) embed.addFields(options.fields);
    
    return embed;
  }
};