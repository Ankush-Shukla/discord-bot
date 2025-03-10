require('dotenv').config();

console.log("🔍 Loading environment variables from .env file...");

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences
  ]
});

// Load BOT_TOKEN from .env
const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("❌ BOT_TOKEN is missing from .env file!");
  process.exit(1); // Stop the program if no token is found
} else {
  console.log("✅ BOT_TOKEN loaded successfully.");
}

// Create a collection for commands
client.queue = new Map(); // Stores queues for each guild

client.commands = new Collection();


// Load command files
const loadCommands = (dir) => {
  const commandFolders = fs.readdirSync(dir);
  for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(`${dir}/${folder}`).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
      const command = require(`${dir}/${folder}/${file}`);
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
      }
    }
  }
};

// Load events
const loadEvents = () => {
  const eventsPath = path.join(__dirname, 'events');
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }
};

loadCommands(path.join(__dirname, 'commands'));
loadEvents();

// Log in using the token from .env
client.login(token);