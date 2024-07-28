const mongoose = require('mongoose');

const serverSettingsSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    language: { type: String, enum: ['en', 'pl'], default: 'en' }
});

module.exports = mongoose.model('ServerSettings', serverSettingsSchema);
