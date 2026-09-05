const scheduleSchema = require('../schemas/schedule-schema');
const nfl = require('../NFL_Teams.js');

module.exports = {
  commands: ['schedule'],
  alias: 'schedule',
  expectedArgs: '<week>',
  minArgs: 1,
  maxArgs: 1,

  callback: async (message, arguments, text, client, mongo, Discord) => {
    const weekWanted = Number(arguments[0]);

    if (
      Number.isNaN(weekWanted) ||
      weekWanted < 1 ||
      weekWanted > 22
    ) {
      return message.reply('Sorry, that week is invalid.');
    }

    try {
      await mongo();

      const data = await scheduleSchema.findOne({
        week: String(weekWanted)
      });

      if (!data) {
        return message.reply(
          "There doesn't seem to be a schedule for that week."
        );
      }

      const schedule = data.games;

      const embed = new Discord.EmbedBuilder()
        .setTitle(`🏈 NFL Schedule for Week ${data.week}`)
        .setColor(Math.floor(Math.random() * 0xffffff));

      let count = 1;

      for (let i = 0; i < schedule.length - 1; i += 2) {
        const awayTeam = schedule[i];
        const homeTeam = schedule[i + 1];

        const awayInfo = nfl.nfl[awayTeam];
        const homeInfo = nfl.nfl[homeTeam];

        const awayEmoji = awayInfo
          ? message.guild.emojis.cache.find(
              emoji => emoji.name === awayInfo.emojiName
            )
          : null;

        const homeEmoji = homeInfo
          ? message.guild.emojis.cache.find(
              emoji => emoji.name === homeInfo.emojiName
            )
          : null;

        const awayName = awayInfo?.name || awayTeam.toUpperCase();
        const homeName = homeInfo?.name || homeTeam.toUpperCase();

        const awayDisplay = awayEmoji
          ? `${awayEmoji} **${awayName}**`
          : `**${awayName}**`;

        const homeDisplay = homeEmoji
          ? `${homeEmoji} **${homeName}**`
          : `**${homeName}**`;

        embed.addFields({
          name: `Game ${count}: ${awayTeam.toUpperCase()} @ ${homeTeam.toUpperCase()}`,
          value:
            `${i + 1}. ${awayDisplay}\n` +
            `${i + 2}. ${homeDisplay}`
        });

        count++;
      }

      return message.channel.send({
        embeds: [embed]
      });

    } catch (error) {
      console.error('Schedule command error:', error);

      return message.reply(
        'There was an error loading the NFL schedule.'
      );
    }
  }
};
