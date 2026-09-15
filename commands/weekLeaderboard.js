const userSchema = require('../schemas/user-schema');
const scheduleSchema = require('../schemas/schedule-schema');

module.exports = {
  commands: ['weekleaderboard'],
  alias: 'weekLeaderboard',
  expectedArgs: '<week>',
  minArgs: 1,
  maxArgs: 1,

  callback: async (message, arguments, text, client, mongo) => {
    const week = Number(arguments[0]);

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
          `I couldn't find the NFL schedule for Week ${week}.`
        );
      }

      if (!scheduleData.winners) {
        return message.reply(
          `Week ${week} has not been scored yet.`
        );
      }

      const numberOfGames = scheduleData.games.length / 2;
      const users = await userSchema.find();

      const standings = users
        .filter(user => {
          const score = user.scores?.[week];
          return score !== undefined && score !== null;
        })
        .map(user => ({
          name: user.name,
          score: Number(user.scores[week]) || 0
        }))
        .sort((a, b) => {
          if (b.score !== a.score) {
            return b.score - a.score;
          }

          return a.name.localeCompare(b.name);
        });

      if (standings.length === 0) {
        return message.reply(
          `There are no calculated scores for Week ${week} yet. Run !setPoints ${week} first.`
        );
      }

      let description = '';

      standings.forEach((player, index) => {
        description +=
          `**${index + 1}. ${player.name}**\n` +
          `${player.score}/${numberOfGames} correct\n\n`;
      });

      const embed = {
        title: `🏆 1st & 10 NFL Pick’em — Week ${week} Leaderboard`,
        description: description,
        footer: {
          text: `Week ${week} Results • ${numberOfGames} NFL Games`
        }
      };

      return message.channel.send({
        embeds: [embed]
      });

    } catch (error) {
      console.error('weekLeaderboard command error:', error);

      return message.reply(
        `There was an error loading the Week ${week} leaderboard.`
      );
    }
  }
};
