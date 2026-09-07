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

      // Find the League Members role.
      const leagueRole = message.guild.roles.cache.find(
        role => role.name.toLowerCase() === 'league members'
      );

      if (!leagueRole) {
        return message.reply(
          'I could not find the "League Members" role.'
        );
      }

      // Make sure the bot has the current server member list.
      await message.guild.members.fetch();

      const leagueMembers = leagueRole.members.filter(
        member => !member.user.bot
      );

      if (leagueMembers.size === 0) {
        return message.reply(
          'I found the League Members role, but there are no members assigned to it.'
        );
      }

      const users = await userSchema.find();

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

        // A normal NFL week can have up to 16 games.
        // Count actual saved selections rather than just array length.
        const submittedPicks = picks.filter(
          pick => pick !== null && pick !== undefined && pick !== ''
        ).length;

        // Get the number of games for this week from the Schedule collection.
        let gameCount = 0;

        try {
          const schedule = await message.client.mongoConnection
            ?.collection('Schedule')
            ?.findOne({ week });

          if (schedule?.games && Array.isArray(schedule.games)) {
            gameCount = schedule.games.length;
          }
        } catch (error) {
          // Fall back below if this connection isn't available.
        }

        // If game count could not be retrieved, use the highest
        // number of picks currently stored for the week as a fallback.
        if (!gameCount) {
          gameCount = Math.max(
            ...users.map(dbUser => {
              const userPicks = dbUser.picks?.[week];
              return Array.isArray(userPicks)
                ? userPicks.filter(
                    pick =>
                      pick !== null &&
                      pick !== undefined &&
                      pick !== ''
                  ).length
                : 0;
            }),
            submittedPicks
          );
        }

        if (submittedPicks >= gameCount && gameCount > 0) {
          completed.push(`<@${member.id}>`);
        } else {
          incomplete.push(
            `<@${member.id}> — ${submittedPicks}/${gameCount || '?'} picks`
          );
        }
      }

      const makeSection = (title, members, emptyText) => {
        if (members.length === 0) {
          return `${title}\n${emptyText}`;
        }

        return `${title}\n${members.join('\n')}`;
      };

      const response =
        `🏈 **Week ${week} Pick’em Status**\n` +
        `**League Members Checked: ${leagueMembers.size}**\n\n` +

        makeSection(
          `✅ **Completed Picks (${completed.length})**`,
          completed,
          'None'
        ) +

        `\n\n` +

        makeSection(
          `🟡 **Incomplete Picks (${incomplete.length})**`,
          incomplete,
          'None'
        ) +

        `\n\n` +

        makeSection(
          `❌ **No Picks (${noPicks.length})**`,
          noPicks,
          'None'
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
