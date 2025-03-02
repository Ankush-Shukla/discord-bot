const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { error, success } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kicks a user from the server')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to kick')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for kicking')
        .setRequired(false)),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    await interaction.deferReply();
    try {
      // Check if the bot has permission to kick members
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
        return await interaction.followUp({
          embeds: [error('Error', 'I do not have permission to kick members')]
        });
      }

      // Check if the command issuer has permission to kick members
      if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
        return await interaction.followUp({
          embeds: [error('Error', 'You do not have permission to kick members')]
        });
      }

      // Fetch the member to kick from the guild
      const memberToKick = await interaction.guild.members.fetch(user.id);

      // Check if the member is kickable (e.g., they might have higher roles than the bot)
      if (!memberToKick.kickable) {
        return await interaction.followUp({
          embeds: [error('Error', 'I cannot kick this user')]
        });
      }

      // Kick the member with the provided reason
      await memberToKick.kick(reason);

      // Send a success message
      await interaction.followUp({
        embeds: [success('User Kicked', `${memberToKick.user.tag} has been kicked.\nReason: ${reason}`)]
      });

      // Log the kick in the mod-logs channel, if it exists
      const logChannel = interaction.guild.channels.cache.find(ch => ch.name === 'mod-logs');
      if (logChannel) {
        logChannel.send(`User ${memberToKick.user.tag} was kicked by ${interaction.user.tag} for: ${reason}`);
      }
    } catch (err) {
      console.error(err);
      return interaction.followUp({
        embeds: [error('Error', 'There was an error trying to kick this user.')],
        ephemeral: true
      });
    }
  },
};
