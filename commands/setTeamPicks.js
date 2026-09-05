const scheduleSchema = require('../schemas/schedule-schema');
const userSchema = require('../schemas/user-schema');

module.exports = {
  commands: ['setteampicks'],
  alias: 'setTeamPicks',
  expectedArgs: '<week> <team> <picks>',
  minArgs: 3,
  maxArgs: 3,

  permissionError: 'You need admin permissions to run this command.',
  permissions: ['ADMINISTRATOR'],

  callback: async (message, arguments, text, client, mongo) => {
    const week = Number(arguments[0]);
    const team = arguments[1];
    const picksString = arguments[2];

    if (Number.isNaN(week) || week < 1 || week > 22) {
      return message.reply('Sorry, that week is invalid.');
    }

    const picksArray = picksString
      .split(/[^0-9]+/)
      .filter(Boolean)
      .map(Number);

    if (picksArray.length === 0) {
      return message.reply(
        'I could not read the picks you entered.'
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

      const schedule = scheduleData.games;
      const numberOfGames = schedule.length / 2;

      if (picksArray.length !== numberOfGames) {
        return message.reply(
          `Week ${week} has ${numberOfGames} games, so you must enter exactly ${numberOfGames} picks.`
        );
      }

      const invalidPick = picksArray.find(
        pick => pick < 1 || pick > schedule.length
      );

      if (invalidPick !== undefined) {
        return message.reply(
          `Pick #${invalidPick} is not valid for Week ${week}.`
        );
      }

      for (let i = 0; i < schedule.length; i += 2) {
        const awayNumber = i + 1;
        const homeNumber = i + 2;

        const pickedAway = picksArray.includes(awayNumber);
        const pickedHome = picksArray.includes(homeNumber);

        if (pickedAway === pickedHome) {
          return message.reply(
            `You must choose exactly one winner from Game ${(i / 2) + 1}.`
          );
        }
      }

      const user = await userSchema.findOne({
        name: team
      });

      if (!user) {
        return message.reply(
          `I couldn't find a user named "${team}" in the Pick'em database.`
        );
      }

      const teamPicks = picksArray.map(
        pickNumber => schedule[pickNumber - 1]
      );

      await userSchema.updateOne(
        { id: user.id },
        {
          $set: {
            [`picks.${week}`]: teamPicks
          }
        }
      );

      return message.reply(
        `✅ I saved ${user.name}'s picks for Week ${week}.`
      );

    } catch (error) {
      console.error('setTeamPicks command error:', error);

      return message.reply(
        "There was an error saving that user's picks."
      );
    }
  }
};
