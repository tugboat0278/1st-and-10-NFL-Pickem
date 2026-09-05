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

    if (Number.isNaN(week) || week < 1 || week > 18) {
      return message.reply('Sorry, that week is invalid.');
    }

    try {
      await mongo();

      const users = await userSchema.find();

      if (users.length === 0) {
        return message.reply(
          'There are no Pick’em players in the database yet.'
        );
      }

      const missingUsers = users.filter(user => {
        const picks = user.picks?.[week];

        return !Array.isArray(picks) || picks.length === 0;
      });

      if (missingUsers.length === 0) {
        return message.reply(
          `✅ Everyone in the Pick’em database has submitted their picks for Week ${week}.`
        );
      }

      const mentions = missingUsers
        .filter(user => user.id)
        .map(user => `<@${user.id}>`);

      if (mentions.length === 0) {
        return message.reply(
          `There are players missing Week ${week} picks, but I couldn't find their Discord IDs.`
        );
      }

      return message.channel.send(
        `🏈 **Week ${week} Pick’em Reminder**\n\n` +
        `${mentions.join(' ')}\n\n` +
        `You still need to submit your Week ${week} NFL picks!`
      );

    } catch (error) {
      console.error('callout command error:', error);

      return message.reply(
        'There was an error checking who still needs to submit picks.'
      );
    }
  }
};
