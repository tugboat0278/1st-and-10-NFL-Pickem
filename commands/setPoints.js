const scheduleSchema = require('../schemas/schedule-schema');
const userSchema = require('../schemas/user-schema');

module.exports = {
  commands: ['setpoints'],
  alias: 'setPoints',
  expectedArgs: '<week> <bonus games> <points per bonus game>',
  minArgs: 3,
  maxArgs: 3,

  permissionError: 'You need admin permissions to run this command.',
  permissions: ['ADMINISTRATOR'],

  callback: async (message, arguments, text, client, mongo) => {
    const week = Number(arguments[0]);

    const bonusGames = arguments[1]
      .split(',')
      .map(game => game.trim())
      .filter(Boolean);

    const bonusPoints = Number(arguments[2]);

    if (Number.isNaN(week) || week < 1 || week > 18) {
      return message.reply('Sorry, that week is invalid.');
    }

    if (Number.isNaN(bonusPoints) || bonusPoints < 1) {
      return message.reply(
        'The bonus-game point value must be a valid number.'
      );
    }

    try {
      await mongo();

      const scheduleData = await scheduleSchema.findOne({
        week: String(week)
      });

      if (!scheduleData) {
        return message.reply(
          `I couldn't find the NFL schedule for Week ${week}.`
        );
      }

      if (!scheduleData.winners) {
        return message.reply(
          `The winners for Week ${week} have not been entered yet.`
        );
      }

      const winners = String(scheduleData.winners)
        .split(',')
        .map(team => team.trim())
        .filter(Boolean);

      const numberOfGames = scheduleData.games.length / 2;

      const invalidBonusGame = bonusGames.find(game => {
        const gameNumber = Number(game);

        return (
          Number.isNaN(gameNumber) ||
          gameNumber < 1 ||
          gameNumber > numberOfGames
        );
      });

      if (invalidBonusGame !== undefined) {
        return message.reply(
          `Bonus game "${invalidBonusGame}" is not valid for Week ${week}.`
        );
      }

      const users = await userSchema.find();

      let scoredUsers = 0;
      let skippedUsers = 0;

      for (const user of users) {
        const picksArray = user.picks?.[week];

        if (!Array.isArray(picksArray) || picksArray.length === 0) {
          skippedUsers++;
          continue;
        }

        let score = 0;

        for (let gameIndex = 0; gameIndex < winners.length; gameIndex++) {
          if (picksArray[gameIndex] === winners[gameIndex]) {
            const gameNumber = String(gameIndex + 1);

            if (bonusGames.includes(gameNumber)) {
              score += bonusPoints;
            } else {
              score += 1;
            }
          }
        }

        await userSchema.updateOne(
          { id: user.id },
          {
            $set: {
              [`scores.${week}`]: score
            }
          }
        );

        scoredUsers++;
      }

      let response =
        `✅ Points have been calculated for Week ${week}. ` +
        `${scoredUsers} player${scoredUsers === 1 ? '' : 's'} scored.`;

      if (skippedUsers > 0) {
        response +=
          ` ${skippedUsers} player${skippedUsers === 1 ? '' : 's'} ` +
          `had no picks and were skipped.`;
      }

      return message.reply(response);

    } catch (error) {
      console.error('setPoints command error:', error);

      return message.reply(
        'There was an error calculating the weekly points.'
      );
    }
  }
};
