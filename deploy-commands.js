const { REST, Routes } = require("discord.js");
const { token, clientId, guildId } = require("./config/config.json");
const fs = require('fs');
const path = require('path');

const commands = [];

const loadCommands = (dir) => {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      loadCommands(path.join(dir, file.name));
    } else if (file.name.endsWith('.js')) {
      const command = require(path.join(dir, file.name));
      if (command.data) {
        commands.push(command.data.toJSON());
      }
    }
  }
};

loadCommands(path.join(__dirname, 'commands'));

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();