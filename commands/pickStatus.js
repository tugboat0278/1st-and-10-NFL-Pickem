const userSchema = require('../schemas/user-schema');

module.exports = {
  commands: ['pickstatus'],
  alias: 'pickstatus',
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

      // Find the League Member role.
      const leagueRole = message.guild.roles.cache.find(
        role => role.name.toLowerCase() === 'league member'
      );

      if (!leagueRole) {
        return message.reply(
          'I could not find the "League Member" role.'
        );
      }

      // Fetch the current server member list.
      await message.guild.members.fetch();

      const leagueMembers = leagueRole.members.filter(
        member => !member.user.bot
      );

      if (leagueMembers.size === 0) {
        return message.reply(
          'I found the League Member role, but nobody has that role.'
        );
      }

      const users = await userSchema.find();

      // Get this week's schedule so we know exactly
      // how many games must be picked.
      const scheduleCollection = message.client.mongoConnection
        ? message.client.mongoConnection.collection('Schedule')
        : null;

      let gameCount = 0;

      if (scheduleCollection) {
        const schedule = await scheduleCollection.findOne({ week });

        if (schedule?.games && Array.isArray(schedule.games)) {
          gameCount = schedule.games.length;
        }
      }

      // Fallback: determine the largest number of saved
      // picks for this week if schedule count is unavailable.
      if (!gameCount) {
        gameCount = Math.max(
          ...users.map(user => {
            const picks = user.picks?.[week];

            if (!Array.isArray(picks)) {
              return 0;
            }

            return picks.filter(
              pick =>
                pick !== null &&
                pick !== undefined &&
                pick !== ''
            ).length;
          }),
          0
        );
      }

      const completed = [];
      const incomplete = [];
      const noPicks = [];

      for (const [, member] of leagueMembers) {
        const user = users.find(
          dbUser => String(dbUser.id) === String(member.id)
        );

        const picks = user?.picks?.[week];

        if (!Array.isArray(picks) || picks.length === 0) {
          noPicks.push(`<@${member.id}>`);
          continue;
        }

        const submittedPicks = picks.filter(
          pick =>
            pick !== null &&
            pick !== undefined &&
            pick !== ''
        ).length;

        if (gameCount > 0 && submittedPicks >= gameCount) {
          completed.push(`<@${member.id}>`);
        } else {
          incomplete.push(
            `<@${member.id}> — ${submittedPicks}/${gameCount || '?'} picks`
          );
        }
      }

      const makeSection = (title, members) => {
        if (members.length === 0) {
          return `${title}\nNone`;
        }

        return `${title}\n${members.join('\n')}`;
      };

      const response =
        `🏈 **Week ${week} Pick’em Status**\n` +
        `**League Members Checked: ${leagueMembers.size}**\n\n` +

        makeSection(
          `✅ **Completed Picks (${completed.length})**`,
          completed
        ) +

        `\n\n` +

        makeSection(
          `🟡 **Incomplete Picks (${incomplete.length})**`,
          incomplete
        ) +

        `\n\n` +

        makeSection(
          `❌ **No Picks (${noPicks.length})**`,
          noPicks
        );

      return message.channel.send(response);

    } catch (error) {
      console.error('pickstatus command error:', error);

      return message.reply(
        'There was an error checking the Pick’em participation status.'
      );
    }
  }
};
