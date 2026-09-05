const {
  Client,
  GatewayIntentBits,
  Partials
} = require('discord.js');

const mongo = require('./mongo.js');
const path = require('path');
const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

const baseFile = 'command-base.js';
const commandBase = require(`./commands/${baseFile}`);

const readCommands = (dir) => {
  const files = fs.readdirSync(path.join(__dirname, dir));

  for (const file of files) {
    const stat = fs.lstatSync(path.join(__dirname, dir, file));

    if (stat.isDirectory()) {
      readCommands(path.join(dir, file));
    } else if (file !== baseFile) {
      const option = require(path.join(__dirname, dir, file));
      commandBase(option);
    }
  }
};

client.once('ready', () => {
  console.log(`1st & 10 NFL Pickem is online as ${client.user.tag}`);

  readCommands('commands');

  commandBase.listen(client, mongo, require('discord.js'));
});

client.login(process.env.DJS_TOKEN);
