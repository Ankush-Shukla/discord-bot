require('dotenv').config();
const { SlashCommandBuilder } = require('discord.js');

const api_key = process.env.STEAM_API_KEY;
module.exports = {
  data: new SlashCommandBuilder()
    .setName('library')
    .setDescription('Shows the library of any given player')
    .addStringOption(option=>
      option.setName('username')
        .setDescription('Steam Username to fetch library data')
        .setRequired(true)
      ),
  async execute(interaction) {

    const username = interaction.options.getString('username');
    // Steam API Example
const response = await fetch(`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${api_key}&vanityurl=${username}`,{
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'User-Agent' : 'Mozila/5.0'
    }
});
console.log(response);
const data = await response.json();
console.log(data);
    await interaction.reply(data.response.steamid);
    console.log(api_key);
  },
};
