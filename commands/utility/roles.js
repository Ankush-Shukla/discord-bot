const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roles')
    .setDescription('Select the roles you want to receive'),
  async execute(interaction) {
    // Define the available roles (update these with your actual role IDs and labels)
    const roleOptions = [
      { label: 'Gamer', value: 'ROLE_ID_GAMER' },
      { label: 'Artist', value: 'ROLE_ID_ARTIST' },
      { label: 'Developer', value: 'ROLE_ID_DEVELOPER' }
    ];

    // Create a select menu with these role options
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('role-select')
      .setPlaceholder('Choose your roles...')
      .setMinValues(1)
      .setMaxValues(roleOptions.length)
      .addOptions(roleOptions);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({ content: 'Select the roles you want to receive:', components: [row], ephemeral: true });
  },
};
