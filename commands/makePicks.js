const scheduleSchema = require('../schemas/schedule-schema');
const userSchema = require('../schemas/user-schema');

module.exports = {
  commands: ['makepicks'],
  alias: 'makePicks',
  expectedArgs: '<week> <picks>',
  minArgs: 2,
  maxArgs: 2,

  callback: async (message, arguments, text, client, mongo) => {
    const week = Number(arguments[0]);
    const picksString = arguments[1];

    if (Number.isNaN(week) || week < 1 || week > 22) {
      return message.reply('Sorry, that week is invalid.');
    }

    // Allows formats such as:
    // 1,4,5,8
    // 1.4.5.8
    // 1-4-5-8
    const picksArray = picksString
      .split(/[^0-9]+/)
      .filter(Boolean)
      .map(Number);

    if (picksArray.length === 0) {
      return message.reply(
        'I could not read your picks. Example: !makePicks 1 1,4,5,8'
      );
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

      const schedule = scheduleData.games;
      const numberOfGames = schedule.length / 2;

      if (picksArray.length !== numberOfGames) {
        return message.reply(
          `Week ${week} has ${numberOfGames} games, so you must make exactly ${numberOfGames} picks.`
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

      // Make sure the user selected exactly one team from every matchup.
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

      const teamPicks = picksArray.map(
        pickNumber => schedule[pickNumber - 1]
      );

      await userSchema.findOneAndUpdate(
        { id: message.author.id },
        {
          $set: {
            name: message.author.username,
            [`picks.${week}`]: teamPicks
          }
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );

      return message.reply(
        `✅ Your picks for Week ${week} have been saved!`
      );

    } catch (error) {
      console.error('makePicks command error:', error);

      return message.reply(
        'There was an error saving your picks.'
      );
    }
  }
};
