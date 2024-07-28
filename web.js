const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const axios = require('axios'); // Dodajemy axios do wykonywania zapytań HTTP
const path = require('path');
const mongoose = require('mongoose');
const User = require('./models/User');
const config = require('./config.json');
const fs = require('fs');

const app = express();

mongoose.connect(config.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => done(err, user));
});

passport.use(new DiscordStrategy({
    clientID: config.clientId,
    clientSecret: config.clientSecret,
    callbackURL: config.callbackURL,
    scope: ['identify', 'guilds']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ discordId: profile.id });
        if (!user) {
            user = new User({ 
                discordId: profile.id, 
                username: profile.username, 
                discriminator: profile.discriminator, 
                avatar: profile.avatar,
                guilds: profile.guilds // Przechowywanie informacji o serwerach
            });
            await user.save();
        } else {
            user.guilds = profile.guilds; // Aktualizacja serwerów użytkownika
            await user.save();
        }
        user.accessToken = accessToken; // Przechowywanie tokena dostępowego
        await user.save();
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send(`
        <html>
        <head>
            <title>Discord Bot Manager</title>
            <style>
                body { font-family: Arial, sans-serif; background-color: #2c2f33; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .container { text-align: center; }
                h1 { margin-bottom: 20px; }
                a { display: inline-block; padding: 10px 20px; background-color: #7289da; color: #fff; text-decoration: none; border-radius: 4px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Discord Bot Manager</h1>
                <a href="/auth/discord">Login with Discord</a>
            </div>
        </body>
        </html>
    `);
});

app.get('/auth/discord', passport.authenticate('discord'));

app.get('/auth/discord/callback', passport.authenticate('discord', {
    failureRedirect: '/'
}), (req, res) => {
    res.redirect('/settings');
});

app.get('/settings', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/');
    }
    const user = req.user;

    // Załaduj plik HTML i dynamicznie wstaw dane użytkownika i serwerów
    fs.readFile(path.join(__dirname, 'views', 'settings.html'), 'utf8', async (err, data) => {
        if (err) {
            return res.status(500).send('Error loading settings page.');
        }

        // Filtrowanie serwerów, na których użytkownik jest właścicielem lub administratorem
        const filteredGuilds = user.guilds.filter(guild => guild.permissions & 0x8); // Sprawdzenie czy użytkownik ma uprawnienia administratora

        // Dynamicznie zastąp dane użytkownika i serwerów
        let page = data
            .replace('USER_AVATAR_URL', `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png`)
            .replace('USER_NAME', `${user.username}#${user.discriminator}`);

        // Dynamicznie dodaj serwery użytkownika
        let serversHtml = '';
        for (const guild of filteredGuilds) {
            let role = guild.owner ? 'Owner' : 'Admin';
            let botAdded = false; // Zakładamy, że bot nie jest dodany
            try {
                console.log(`Sprawdzanie serwera: ${guild.name} (${guild.id})`); // Logowanie ID serwera
                const response = await axios.get(`https://discord.com/api/v9/guilds/${guild.id}/members/${config.clientId}`, {
                    headers: {
                        Authorization: `Bot ${config.botToken}`
                    }
                });
                console.log('Odpowiedź API:', response.data); // Logowanie odpowiedzi API
                if (response.data) {
                    botAdded = true;
                }
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    botAdded = false;
                } else {
                    console.error('Błąd podczas sprawdzania statusu bota:', error); // Lepsze logowanie błędów
                }
            }
            let button = botAdded ? '<button class="button configure">Configure</button>' : '<button class="button add-bot">Add Bot</button>';
            serversHtml += `
                <div class="server">
                    <img src="https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png" alt="Server Icon" width="50">
                    <h3>${guild.name}</h3>
                    <p>Role: ${role}</p>
                    ${button}
                </div>
            `;
        }
        page = page.replace('<!-- Servers will be inserted here -->', serversHtml);

        res.send(page);
    });
});

app.use('/settings', require('./routes/settings'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
