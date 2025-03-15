const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { userInfoEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Get detailed information about a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user you want info about')
                .setRequired(true)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const member = await interaction.guild.members.fetch(user.id);
        
        const embed = userInfoEmbed(user, member, interaction.user);
        await interaction.reply({ embeds: [embed] });
      
    }
};
