const userSchema = require('../schemas/user-schema');

module.exports = {
  commands: ['callout'],
  alias: 'callout',
  expectedArgs: '<week>',
  minArgs: 1,
  maxArgs: 1,

  permissionError: 'You need admin permissions to run this command.',
  permissions: ['ADMINISTRATOR'],

  callback: async (message, arguments, text, client, mongo) => {
    const week = Number(arguments[0]);

    if (Number.isNaN(week) || week < 1 || week > 22) {
      return message.reply('Sorry, that week is invalid.');
    }

    try {
      await mongo();

      const users = await userSchema.find();

      const missingUsers = users.filter(user => {
        const picks = user.picks?.[week];
        return !picks || picks.length === 0;
      });

      if (missingUsers.length === 0) {
        return message.reply(
          `✅ Everyone has submitted their picks for Week ${week}.`
        );
      }

      for (const user of missingUsers) {
        if (!user.id) continue;

        await message.channel.send(
          `<@${user.id}> You haven't submitted your picks for Week ${week}.`
        );
      }

    } catch (error) {
      console.error('callout command error:', error);

      return message.reply(
        'There was an error checking who still needs to submit picks.'
      );
    }
  }
};
