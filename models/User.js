const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    discordId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    discriminator: { type: String, required: true },
    avatar: { type: String, required: true },
    guilds: { type: Array, required: true } // Dodajemy pole guilds do przechowywania informacji o serwerach użytkownika
});

module.exports = mongoose.model('User', userSchema);
