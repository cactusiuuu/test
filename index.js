const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { token, mongoURI } = require('./config.json');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { log } = require('./utils/logger');
const ServerSettings = require('./models/ServerSettings');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.commands = new Collection();

// Handlers
const commandHandler = require('./handlers/commandHandler');
const eventHandler = require('./handlers/eventHandler');

commandHandler(client);
eventHandler(client);

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => log('Successfully connected to MongoDB', '+', 'green'))
  .catch(err => log(`Error connecting to MongoDB: ${err}`, 'x', 'red'));

client.login(token).then(() => log('Successfully logged in', '+', 'green'))
                   .catch(err => log(`Error logging in: ${err}`, 'x', 'red'));

// Middleware to get server settings
client.getServerLanguage = async (guildId) => {
    const settings = await ServerSettings.findOne({ guildId });
    return settings ? settings.language : 'en';
};

module.exports = client;
