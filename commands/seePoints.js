const userSchema = require('../schemas/user-schema');

module.exports = {
  commands: ['seepoints'],
  alias: 'seePoints',
  expectedArgs: '<week>',
  minArgs: 1,
  maxArgs: 1,

  callback: async (message, arguments, text, client, mongo, Discord) => {
    const week = Number(arguments[0]);

    if (Number.isNaN(week) || week < 1 || week > 18) {
      return message.reply('Sorry, that week is invalid.');
    }

    try {
      await mongo();

      const users = await userSchema.find();

      const teamsAndScoresArray = users
        .map(user => {
          const score = user.scores?.[week];

          if (score === undefined || score === null || score === '') {
            return null;
          }

          return [
            user.name || 'Unknown User',
            Number(score)
          ];
        })
        .filter(Boolean)
        .sort((a, b) => b[1] - a[1]);

      if (teamsAndScoresArray.length === 0) {
        return message.reply(
          `There are no scores recorded for Week ${week} yet.`
        );
      }

      const embed = new Discord.EmbedBuilder()
        .setTitle(`🏈 Scores for Week ${week}`)
        .setColor(Math.floor(Math.random() * 0xffffff));

      teamsAndScoresArray.forEach(([name, score], index) => {
        embed.addFields({
          name: `${index + 1}. ${name}`,
          value: `${score} point${score === 1 ? '' : 's'}`
        });
      });

      return message.channel.send({
        embeds: [embed]
      });

    } catch (error) {
      console.error('seePoints command error:', error);

      return message.reply(
        'There was an error loading the Week scores.'
      );
    }
  }
};
