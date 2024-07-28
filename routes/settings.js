const express = require('express');
const router = express.Router();
const ServerSettings = require('../models/ServerSettings');
const client = require('../index');

router.get('/', async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
        return res.redirect('/auth/discord');
    }

    // Pobierz serwery, na których użytkownik ma uprawnienia administracyjne
    const guilds = req.user.guilds.filter(guild => (guild.owner || (guild.permissions & 0x8) === 0x8));
    
    // Pobierz listę ID serwerów, na których jest bot
    const botGuilds = client.guilds.cache.map(guild => guild.id);
    
    // Logowanie dla debugowania
    console.log('Użytkownik Guilds:', guilds.map(guild => guild.id));
    console.log('Bot Guilds:', botGuilds);

    res.send(`
        <html>
        <head>
            <title>Server Settings</title>
            <style>
                body { font-family: Arial, sans-serif; background-color: #2c2f33; color: #fff; margin: 0; padding: 0; }
                .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
                .guild-list { display: flex; flex-wrap: wrap; gap: 20px; }
                .guild { background-color: #23272a; padding: 20px; border-radius: 8px; flex: 1 1 calc(33.333% - 40px); box-sizing: border-box; display: flex; flex-direction: column; align-items: center; }
                .guild img { border-radius: 50%; width: 60px; height: 60px; margin-bottom: 10px; }
                .guild button { padding: 10px 20px; border: none; border-radius: 4px; font-size: 16px; cursor: pointer; }
                .guild .configure { background-color: #7289da; color: #fff; }
                .guild .add-bot { background-color: #99aab5; color: #fff; }
                .guild .role { margin-top: 10px; font-size: 14px; color: #99aab5; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Select server and configure</h1>
                <div class="guild-list">
                    ${guilds.map(guild => `
                        <div class="guild">
                            <img src="https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png" alt="${guild.name}">
                            <span>${guild.name}</span>
                            <span class="role">${guild.owner ? 'Owner' : 'Admin'}</span>
                            <form action="${botGuilds.includes(guild.id) ? '/settings/configure' : '/settings/add-bot'}" method="post">
                                <input type="hidden" name="guildId" value="${guild.id}">
                                <button class="${botGuilds.includes(guild.id) ? 'configure' : 'add-bot'}" type="submit">${botGuilds.includes(guild.id) ? 'Configure' : 'Add Bot'}</button>
                            </form>
                        </div>
                    `).join('')}
                </div>
            </div>
        </body>
        </html>
    `);
});


router.post('/set-language', async (req, res) => {
    const { guildId, language } = req.body;
    if (!req.isAuthenticated() || !req.user) {
        return res.redirect('/auth/discord');
    }
    try {
        await ServerSettings.findOneAndUpdate(
            { guildId },
            { language },
            { upsert: true, new: true }
        );
        res.send('<script>alert("Language setting updated successfully."); window.location.href = "/settings";</script>');
    } catch (error) {
        res.status(500).send('An error occurred while updating the language setting.');
    }
});

router.post('/configure', async (req, res) => {
    const { guildId } = req.body;
    if (!req.isAuthenticated() || !req.user) {
        return res.redirect('/auth/discord');
    }
    res.send(`
        <html>
        <head>
            <title>Configure Server</title>
            <style>
                body { font-family: Arial, sans-serif; background-color: #2c2f33; color: #fff; margin: 0; padding: 0; }
                .container { display: flex; }
                .sidebar { width: 200px; background-color: #23272a; height: 100vh; padding: 20px; box-sizing: border-box; }
                .content { flex: 1; padding: 20px; }
                .sidebar ul { list-style: none; padding: 0; }
                .sidebar ul li { margin-bottom: 10px; }
                .sidebar ul li a { color: #7289da; text-decoration: none; }
                .sidebar .user { position: absolute; bottom: 20px; width: calc(100% - 40px); }
                .sidebar .user img { border-radius: 50%; width: 40px; height: 40px; vertical-align: middle; }
                .sidebar .user span { vertical-align: middle; margin-left: 10px; }
                .save-btn { position: absolute; top: 20px; right: 20px; background-color: #7289da; color: #fff; border: none; padding: 10px 20px; border-radius: 4px; cursor: not-allowed; }
                .save-btn.enabled { background-color: #7289da; cursor: pointer; }
                .save-btn.disabled { background-color: #99aab5; cursor: not-allowed; }
                .alert { position: fixed; bottom: 20px; right: 20px; background-color: #7289da; color: #fff; padding: 10px 20px; border-radius: 4px; display: none; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="sidebar">
                    <ul>
                        <li><a href="#">Settings</a></li>
                    </ul>
                    <div class="user">
                        <img src="https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png" alt="${req.user.username}">
                        <span>${req.user.username}</span>
                    </div>
                </div>
                <div class="content">
                    <h1>Configure Server: ${guildId}</h1>
                    <form id="settings-form">
                        <input type="hidden" name="guildId" value="${guildId}">
                        <label for="language">Language:</label>
                        <select id="language" name="language">
                            <option value="en">English</option>
                            <option value="pl">Polish</option>
                        </select>
                    </form>
                    <button class="save-btn disabled" id="save-btn" disabled>Save</button>
                </div>
            </div>
            <div class="alert" id="alert">Successfully saved changes.</div>
            <script>
                document.getElementById('language').addEventListener('change', function() {
                    document.getElementById('save-btn').classList.remove('disabled');
                    document.getElementById('save-btn').classList.add('enabled');
                    document.getElementById('save-btn').disabled = false;
                });

                document.getElementById('save-btn').addEventListener('click', async function() {
                    const form = document.getElementById('settings-form');
                    const data = new URLSearchParams(new FormData(form));

                    const response = await fetch('/settings/set-language', {
                        method: 'POST',
                        body: data
                    });

                    if (response.ok) {
                        document.getElementById('save-btn').classList.remove('enabled');
                        document.getElementById('save-btn').classList.add('disabled');
                        document.getElementById('save-btn').disabled = true;
                        document.getElementById('alert').style.display = 'block';
                        setTimeout(() => {
                            document.getElementById('alert').style.display = 'none';
                        }, 3000);
                    } else {
                        alert('An error occurred while saving changes.');
                    }
                });
            </script>
        </body>
        </html>
    `);
});

router.post('/add-bot', (req, res) => {
    const { guildId } = req.body;
    if (!req.isAuthenticated() || !req.user) {
        return res.redirect('/auth/discord');
    }
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&scope=bot&permissions=8&guild_id=${guildId}`;
    res.redirect(inviteUrl);
});

module.exports = router;
