const scheduleSchema = require('../schemas/schedule-schema');
const userSchema = require('../schemas/user-schema');
const nfl = require('../NFL_Teams.js');

module.exports = {
  commands: ['seepicks'],
  alias: 'seePicks',
  expectedArgs: '<week>',
  minArgs: 1,
  maxArgs: 1,

  callback: async (message, arguments, text, client, mongo, Discord) => {
    const week = Number(arguments[0]);
    const authorId = message.author.id;

    if (Number.isNaN(week) || week < 1 || week > 22) {
      return message.reply('Sorry, that week is invalid.');
    }

    try {
      await mongo();

      const user = await userSchema.findOne({
        id: authorId
      });

      if (!user) {
        return message.reply(
          "It doesn't look like you have any saved picks yet."
        );
      }

      const scheduleData = await scheduleSchema.findOne({
        week: String(week)
      });

      if (!scheduleData) {
        return message.reply(
          `I couldn't find the NFL schedule for Week ${week}.`
        );
      }

      const picksArray = user.picks?.[week];

      if (!picksArray || picksArray.length === 0) {
        return message.reply(
          `It doesn't look like you have any picks saved for Week ${week}.`
        );
      }

      const schedule = scheduleData.games;

      const embed = new Discord.EmbedBuilder()
        .setTitle(`🏈 Your Picks for Week ${week}`)
        .setColor(Math.floor(Math.random() * 0xffffff));

      let pickIndex = 0;

      for (let i = 0; i < schedule.length - 1; i += 2) {
        const awayCode = schedule[i];
        const homeCode = schedule[i + 1];
        const pickedCode = picksArray[pickIndex];

        const awayName = nfl.nfl[awayCode]?.name || awayCode.toUpperCase();
        const homeName = nfl.nfl[homeCode]?.name || homeCode.toUpperCase();
        const pickedName = nfl.nfl[pickedCode]?.name || pickedCode?.toUpperCase();

        const opponentName =
          pickedCode === awayCode ? homeName : awayName;

        embed.addFields({
          name: `Game ${pickIndex + 1}`,
          value: `You picked **${pickedName}** to beat **${opponentName}**`
        });

        pickIndex++;
      }

      return message.channel.send({
        embeds: [embed]
      });

    } catch (error) {
      console.error('seePicks command error:', error);

      return message.reply(
        'There was an error loading your picks.'
      );
    }
  }
};
