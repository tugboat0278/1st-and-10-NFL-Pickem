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

        let awayDisplay = awayTeam.toUpperCase();
        let homeDisplay = homeTeam.toUpperCase();

        if (awayInfo) {
          awayDisplay =
            `<:${awayInfo.name}:${awayInfo.id}> ${awayTeam.toUpperCase()}`;
        }

        if (homeInfo) {
          homeDisplay =
            `<:${homeInfo.name}:${homeInfo.id}> ${homeTeam.toUpperCase()}`;
        }

        embed.addFields({
          name: `Game ${count}: ${awayTeam.toUpperCase()} @ ${homeTeam.toUpperCase()}`,
          value: `${i + 1}. ${awayDisplay} vs. ${i + 2}. ${homeDisplay}`
        });

        count++;
      }

      await message.channel.send({
        embeds: [embed]
      });

    } catch (error) {
      console.error('Schedule command error:', error);

      await message.reply(
        'There was an error loading the NFL schedule.'
      );
    }
  }
};
