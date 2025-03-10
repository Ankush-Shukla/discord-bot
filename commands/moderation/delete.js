const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delete')
        .setDescription('Deletes a specified number of messages from the channel.')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The number of messages to delete (1-100)')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages), // Requires "Manage Messages" permission

    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');

        // Ensure amount is between 1-100
        if (amount < 1 || amount > 100) {
            return interaction.reply({ content: '❌ You can only delete between 1 and 100 messages.', ephemeral: true });
        }

        // Try to delete messages
        try {
            const messages = await interaction.channel.bulkDelete(amount, true);
            await interaction.reply({ content: `✅ Deleted ${messages.size} messages.`, ephemeral: true });

            // Delete bot's reply after 5 seconds
            setTimeout(() => interaction.deleteReply(), 5000);
        } catch (error) {
            console.error('Error deleting messages:', error);
            await interaction.reply({ content: '❌ Failed to delete messages. Make sure I have the correct permissions.', ephemeral: true });
        }
    }
};
