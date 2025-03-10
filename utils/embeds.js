const { EmbedBuilder } = require('discord.js');

function nowPlayingEmbed(serverName, serverIcon, songTitle, songArtist, duration, queueLength, volume, requester, thumbnail) {
  return new EmbedBuilder()
      .setColor('#ff0000')
      .setAuthor({ name: serverName, iconURL: serverIcon })
      .setTitle('Now Playing')
      .setDescription(`**${songTitle} — ${songArtist}**`)
      .setThumbnail(thumbnail)
      .addFields(
          { name: '⏱ Duration', value: `\`${duration}\``, inline: true },
          { name: '📂 Queue Position', value: `\`${queueLength}\``, inline: true },
          { name: '🔊 Volume', value: `\`${volume}%\``, inline: true }
      )
      .addFields({ name: '🎧 Requested by', value: `<@${requester}>`, inline: false })
      .setTimestamp();
}

// ✅ Enhanced User Info Embed with More Details
function userInfoEmbed(user, member, requester) {
  const avatar = user.displayAvatarURL({ dynamic: true, size: 1024 });
  const banner = user.bannerURL({ dynamic: true, size: 1024 }) || null;
  const createdAt = `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`;
  const joinedAt = member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : 'Not in Server';
  const roles = member.roles.cache
    .filter(role => role.id !== member.guild.id)
    .map(role => `<@&${role.id}>`)
    .join(', ') || 'No Roles';

  const boostStatus = member.premiumSince ? `Since <t:${Math.floor(member.premiumSinceTimestamp / 1000)}:R>` : 'Not Boosting';
  const isBot = user.bot ? '✅ Yes' : '❌ No';
  const nickname = member.nickname || 'No Nickname';
  const highestRole = member.roles.highest.name || 'None';
  const status = member.presence?.status || 'undefined';
  const activity = member.presence?.activities[0] ? member.presence.activities[0].name : 'None';
  const serverPermissions = member.permissions.toArray().length; // Number of permissions user has

  return new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`👤 User Info: ${user.tag}`)
      .setThumbnail(avatar)
      .setImage(banner)
      .addFields(
          { name: '🆔 User ID', value: `\`${user.id}\``, inline: true },
          { name: '📅 Account Created', value: createdAt, inline: true },
          { name: '📥 Joined Server', value: joinedAt, inline: true },
          { name: '🔹 Nickname', value: nickname, inline: true },
          { name: '💼 Highest Role', value: highestRole, inline: true },
          { name: '⚡ Boosting Server', value: boostStatus, inline: true },
          { name: '🤖 Is Bot?', value: isBot, inline: true },
          { name: '🟢 Status', value: status, inline: true },
          { name: '🎮 Current Activity', value: activity, inline: true },
          { name: '🔑 Number of Permissions', value: `${serverPermissions} Permissions`, inline: true },
          { name: '🎭 Roles', value: roles, inline: false }
      )
      .setFooter({ text: `Requested by ${requester.tag}`, iconURL: requester.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();
}

module.exports = {
  nowPlayingEmbed,
  userInfoEmbed,

  success: (title, description) => {
    return new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle(title)
      .setDescription(description)
      .setTimestamp();
  },

  error: (title, description) => {
    return new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle(title)
      .setDescription(description)
      .setTimestamp();
  },

  info: (title, description) => {
    return new EmbedBuilder()
      .setColor('#0099FF')
      .setTitle(title)
      .setDescription(description)
      .setTimestamp();
  },

  custom: (options) => {
    const embed = new EmbedBuilder().setColor(options.color || '#0099FF').setTimestamp();
    
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
