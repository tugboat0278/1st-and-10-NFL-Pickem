const scheduleSchema = require('../schemas/schedule-schema');

module.exports = {
  commands: ['setwinners'],
  alias: 'setWinners',
  expectedArgs: '<week> <winners>',
  minArgs: 2,
  maxArgs: 2,

  permissionError: 'You need admin permissions to run this command.',
  permissions: ['ADMINISTRATOR'],

  callback: async (message, arguments, text, client, mongo) => {
    const week = Number(arguments[0]);
    const winnersString = arguments[1];

    if (Number.isNaN(week) || week < 1 || week > 22) {
      return message.reply('Sorry, that week is invalid.');
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

    try {
      await mongo();

      const schedule = await scheduleSchema.findOne({
        week: String(week)
      });

      if (!schedule) {
        return message.reply(
          `I couldn't find an NFL schedule for Week ${week}.`
        );
      }

      const numberOfGames = Array.isArray(schedule.games)
        ? Math.floor(schedule.games.length / 2)
        : 0;

      if (
        numberOfGames > 0 &&
        winners.length !== numberOfGames
      ) {
        return message.reply(
          `Week ${week} has ${numberOfGames} games, but you entered ` +
          `${winners.length} winners. Please enter one winner for every game.`
        );
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
        'There was an error saving the winners for that week.'
      );
    }
  }
};
