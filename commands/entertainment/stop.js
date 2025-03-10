const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stops the music and makes the bot leave the voice channel'),

    async execute(interaction) {
        const connection = getVoiceConnection(interaction.guildId);
        
        if (!connection) {
            return await interaction.reply({ content: '❌ | I am not in a voice channel!', ephemeral: true });
        }

        connection.destroy(); // ✅ Disconnect bot from VC
        await interaction.reply(' Music stopped and I have left the voice channel!');
    }
};
