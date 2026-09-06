const scheduleSchema = require('../schemas/schedule-schema');

module.exports = {
  commands: ['pickemlock'],
  alias: 'pickemLock',
  expectedArgs: '<week> <open | close | status>',
  minArgs: 2,
  maxArgs: 2,

  permissionError:
    'You need administrator permissions to control the Pick’em lock.',

  permissions: ['ADMINISTRATOR'],

  callback: async (
    message,
    arguments,
    text,
    client,
    mongo
  ) => {
    const week = Number(arguments[0]);
    const action = String(arguments[1]).toLowerCase();

    if (
      Number.isNaN(week) ||
      week < 1 ||
      week > 18
    ) {
      return message.reply(
        'Sorry, that week is invalid.'
      );
    }

    if (
      action !== 'open' &&
      action !== 'close' &&
      action !== 'status'
    ) {
      return message.reply(
        'Use `open`, `close`, or `status`.\n' +
        `Example: \`!pickemlock ${week} close\``
      );
    }

    try {
      await mongo();

      const scheduleData =
        await scheduleSchema.collection.findOne({
          week: String(week)
        });

      if (!scheduleData) {
        return message.reply(
          `I couldn't find the NFL schedule for Week ${week}.`
        );
      }

      /*
        CHECK CURRENT STATUS
      */
      if (action === 'status') {
        const isOpen =
          scheduleData.pickemOpen !== false;

        if (isOpen) {
          return message.reply(
            `🟢 Week ${week} Pick'em is currently **OPEN**.`
          );
        }

        return message.reply(
          `🔒 Week ${week} Pick'em is currently **CLOSED**.`
        );
      }

      /*
        OPEN PICK'EM
      */
      if (action === 'open') {
        await scheduleSchema.collection.updateOne(
          {
            week: String(week)
          },
          {
            $set: {
              pickemOpen: true
            }
          }
        );

        return message.reply(
          `✅ Week ${week} Pick'em is now **OPEN**.\n` +
          'Members can submit or change their picks.'
        );
      }

      /*
        CLOSE PICK'EM
      */
      if (action === 'close') {
        await scheduleSchema.collection.updateOne(
          {
            week: String(week)
          },
          {
            $set: {
              pickemOpen: false
            }
          }
        );

        return message.reply(
          `🔒 Week ${week} Pick'em is now **CLOSED**.\n` +
          'Members can no longer submit or change their picks.'
        );
      }

    } catch (error) {
      console.error(
        'pickemLock command error:',
        error
      );

      return message.reply(
        'There was an error changing the Pick’em lock.'
      );
    }
  }
};
