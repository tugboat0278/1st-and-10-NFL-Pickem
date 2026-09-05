const scheduleSchema = require('../schemas/schedule-schema');
const userSchema = require('../schemas/user-schema');

module.exports = {
  commands: ['setwinners'],
  alias: 'setWinners',
  expectedArgs: '<week> <winners or clear>',
  minArgs: 2,
  maxArgs: 2,

  permissionError: 'You need admin permissions to run this command.',
  permissions: ['ADMINISTRATOR'],

  callback: async (message, arguments, text, client, mongo) => {
    const week = Number(arguments[0]);
    const winnersString = arguments[1];

    if (Number.isNaN(week) || week < 1 || week > 18) {
      return message.reply('Sorry, that week is invalid.');
    }

    try {
      await mongo();

      const scheduleData = await scheduleSchema.findOne({
        week: String(week)
      });

      if (!scheduleData) {
        return message.reply(
          `I couldn't find an NFL schedule for Week ${week}.`
        );
      }

      if (winnersString.toLowerCase() === 'clear') {
        await scheduleSchema.updateOne(
          { week: String(week) },
          {
            $set: {
              winners: ''
            }
          }
        );

        await userSchema.updateMany(
          {},
          {
            $unset: {
              [`picks.${week}`]: '',
              [`scores.${week}`]: ''
            }
          }
        );

        return message.reply(
          `✅ Week ${week} test data has been cleared. Picks, winners, and scores were removed.`
        );
      }

      const winners = winnersString
        .split(',')
        .map(winner => winner.trim())
        .filter(Boolean);

      if (winners.length === 0) {
        return message.reply(
          'I could not read the winning teams you entered.'
        );
      }

      const schedule = scheduleData.games;
      const numberOfGames = schedule.length / 2;

      if (winners.length !== numberOfGames) {
        return message.reply(
          `Week ${week} has ${numberOfGames} games, but you entered ${winners.length} winners.`
        );
      }

      for (let gameIndex = 0; gameIndex < numberOfGames; gameIndex++) {
        const awayTeam = schedule[gameIndex * 2];
        const homeTeam = schedule[(gameIndex * 2) + 1];
        const winner = winners[gameIndex];

        if (winner !== awayTeam && winner !== homeTeam) {
          return message.reply(
            `Game ${gameIndex + 1} is ${awayTeam.toUpperCase()} @ ${homeTeam.toUpperCase()}, but "${winner}" is not one of those teams.`
          );
        }
      }

      await scheduleSchema.updateOne(
        { week: String(week) },
        {
          $set: {
            winners: winners.join(',')
          }
        }
      );

      return message.reply(
        `✅ Winners have been set for Week ${week}.`
      );

    } catch (error) {
      console.error('setWinners command error:', error);

      return message.reply(
        'There was an error updating the winners for that week.'
      );
    }
  }
};
