const mongoose = require('mongoose');

const GuildSchema = new mongoose.Schema({
    guildId: String,
    name: String,
    icon: String,
    owner: Boolean,
    permissions: Number,
    botAdded: Boolean // Nowe pole do przechowywania informacji o obecności bota
});

module.exports = mongoose.model('Guild', GuildSchema);
