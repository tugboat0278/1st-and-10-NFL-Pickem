
const userSchema = require('../schemas/user-schema');

module.exports = {
  commands: ['pickemleaderboard'],
  alias: 'pickemleaderboard',
  expectedArgs: '',
  minArgs: 0,
  maxArgs: 0,

  callback: async (message, arguments, text, client, mongo, Discord) => {
    try {
      await mongo();

      if (!message.guild) {
        return message.reply(
          'This command must be used inside a Discord server.'
        );
      }

      // Get the current members of the Discord server.
      // This excludes people who have left the server.
      const guildMembers = await message.guild.members.fetch();

      const users = await userSchema.find();

      const leaderboard = users
        .filter(user => guildMembers.has(String(user.id)))
        .map(user => {
          const scores = user.scores || {};

          const totalScore = Object.values(scores).reduce(
            (total, score) => total + Number(score || 0),
            0
          );

          return {
            name: user.name || 'Unknown User',
            score: totalScore
          };
        })
        .sort((a, b) => b.score - a.score);

      if (leaderboard.length === 0) {
        return message.reply(
          'There are no current server members on the Pick’em leaderboard yet.'
        );
      }

      // Discord allows up to 25 fields per embed.
      const playersPerPage = 25;
      const totalPages = Math.ceil(leaderboard.length / playersPerPage);

      for (let page = 0; page < totalPages; page++) {
        const start = page * playersPerPage;
        const pagePlayers = leaderboard.slice(
          start,
          start + playersPerPage
        );

        const embed = new Discord.EmbedBuilder()
          .setTitle('🏆 1st & 10 NFL Pick’em Leaderboard')
          .setColor(Math.floor(Math.random() * 0xffffff))
          .setFooter({
            text: `Page ${page + 1} of ${totalPages}`
          });

        pagePlayers.forEach((player, index) => {
          embed.addFields({
            name: `${start + index + 1}. ${player.name}`,
            value: `${player.score} point${player.score === 1 ? '' : 's'}`
          });
        });

        await message.channel.send({
          embeds: [embed]
        });
      }

    } catch (error) {
      console.error('pickemleaderboard command error:', error);

      return message.reply(
        'There was an error loading the Pick’em leaderboard.'
      );
    }
  }
};
