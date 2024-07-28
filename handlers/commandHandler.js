const fs = require('fs');
const path = require('path');
const { log } = require('../utils/logger');

module.exports = (client) => {
    const commandFiles = fs.readdirSync(path.join(__dirname, '..', 'commands')).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(`../commands/${file}`);
        client.commands.set(command.data.name, command);
        log(`Loaded command ${command.data.name}`, '+', 'green');
    }
};
