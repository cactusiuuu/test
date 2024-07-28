const { log } = require('../utils/logger');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.execute(interaction);
            log(`Executed command ${interaction.commandName}`, '+', 'green');
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            log(`Error executing command ${interaction.commandName}`, 'x', 'red');
        }
    }
};
