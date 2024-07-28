const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    async execute(interaction) {
        const language = await interaction.client.getServerLanguage(interaction.guildId);
        const responses = {
            en: `Pong! Latency is ${interaction.client.ws.ping}ms.`,
            pl: `Pong! Opóźnienie wynosi ${interaction.client.ws.ping}ms.`
        };
        await interaction.reply(responses[language]);
    }
};
