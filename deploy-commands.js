const { REST, Routes, SlashCommandBuilder } = require("discord.js");
const { token, clientId, guildId } = require("./config.json");

const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with pong"),
  new SlashCommandBuilder()
    .setName("hello")
    .setDescription("Replies Hey!"),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    // First, remove all existing commands to avoid duplicates (for the specific guild)
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });

    // Register new commands for the specific guild
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error('Error during command registration:', error);
  }
})();
