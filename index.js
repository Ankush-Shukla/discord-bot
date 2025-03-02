const { Client, Collection, Events, GatewayIntentBits } = require("discord.js");
const { token } = require("./config/config.json");
const fs = require("fs");
const path = require("path");

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // Required for member join events
  ],
});

// Create a collection to store your commands
client.commands = new Collection();
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// Recursively read command files from the commands directory
const loadCommands = (dir) => {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      loadCommands(path.join(dir, file.name));
    } else if (file.name.endsWith('.js')) {
      const command = require(path.join(dir, file.name));
      if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
      }
    }
  }
};

loadCommands(path.join(__dirname, 'commands'));

client.once(Events.ClientReady, (c) => {
  console.log(`Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: "There was an error executing that command!", ephemeral: true });
  }
});

client.login(token);