const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    console.log(`${member.user.tag} joined the server.`);

    // Find your welcome channel by name (adjust the channel name as needed)
    const welcomeChannel = member.guild.channels.cache.find(
      channel => channel.name === "welcome"
    );
    if (!welcomeChannel) return;

    // Get total member count of the guild
    const userCount = member.guild.memberCount;

    // Format account creation and server join dates using toLocaleString()
    const accountCreationDate = member.user.createdAt.toLocaleString('en-US', {
      dateStyle: 'long',
      timeStyle: 'short'
    });
    const serverJoinDate = member.joinedAt
      ? member.joinedAt.toLocaleString('en-US', {
        dateStyle: 'long',
        timeStyle: 'short'
      })
      : 'Unknown';

    // Create the welcome embed with additional fields
    const welcomeEmbed = new EmbedBuilder()
      .setTitle("A new member has joined!")
      .setTimestamp()
      .setDescription(`Hello ${member.user}, welcome to **${member.guild.name}**!`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Account Created', value: `${accountCreationDate}`, inline: false },
        { name: 'Joined Server', value: `${serverJoinDate}`, inline: false }
      )
      .setColor("#0099FF")
      .setTimestamp()
      .setFooter({ text: `Member count : ${userCount} `  });

    // Send the embed to the welcome channel
    welcomeChannel.send({ embeds: [welcomeEmbed] });

    // Add a role to the new member (optional)
    member.roles.add('918137909348016149')
      .then(() => console.log(`Added role to ${member.user.tag}`))
      .catch(err => console.error('Failed to add role:', err));

    // Optionally kick the user (comment out if not needed)
    /*
    member.kick('You are not welcome')
      .then(() => {
        console.log(`Kicked ${member.user.tag}`);
      })
      .catch(err => {
        console.error('Failed to kick user:', err);
      });
    */
  },
};
