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

    if (Number.isNaN(week) || week < 1 || week > 18) {
      return message.reply('Sorry, that week is invalid.');
    }

    try {
      await mongo();

      const user = await userSchema.findOne({
        id: message.author.id
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

      const picksArray =
        user.picks?.[week] ||
        user.picks?.[week - 1];

      if (!Array.isArray(picksArray) || picksArray.length === 0) {
        return message.reply(
          `It doesn't look like you have any picks saved for Week ${week}.`
        );
      }

      const schedule = scheduleData.games;

      const embed = new Discord.EmbedBuilder()
        .setTitle(`🏈 Your Picks for Week ${week}`)
        .setColor(Math.floor(Math.random() * 0xffffff));

      for (let gameIndex = 0; gameIndex < picksArray.length; gameIndex++) {
        const scheduleIndex = gameIndex * 2;

        const awayCode = schedule[scheduleIndex];
        const homeCode = schedule[scheduleIndex + 1];
        const pickedCode = picksArray[gameIndex];

        const pickedInfo = nfl.nfl[pickedCode];
        const awayInfo = nfl.nfl[awayCode];
        const homeInfo = nfl.nfl[homeCode];

        const pickedEmoji = pickedInfo
          ? message.guild.emojis.cache.find(
              emoji => emoji.name === pickedInfo.emojiName
            )
          : null;

        const pickedName =
          pickedInfo?.name || pickedCode?.toUpperCase();

        const opponentCode =
          pickedCode === awayCode ? homeCode : awayCode;

        const opponentInfo = nfl.nfl[opponentCode];
        const opponentName =
          opponentInfo?.name || opponentCode?.toUpperCase();

        embed.addFields({
          name: `Game ${gameIndex + 1}: ${awayCode.toUpperCase()} @ ${homeCode.toUpperCase()}`,
          value:
            `${pickedEmoji ? `${pickedEmoji} ` : ''}` +
            `You picked **${pickedName}** to beat **${opponentName}**`
        });
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
