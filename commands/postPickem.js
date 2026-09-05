const scheduleSchema = require('../schemas/schedule-schema');

module.exports = {
  commands: ['postpickem'],
  alias: 'postPickem',
  expectedArgs: '<week>',
  minArgs: 1,
  maxArgs: 1,

  permissionError: 'You need admin permissions to post the Pick’em panel.',
  permissions: ['ADMINISTRATOR'],

  callback: async (message, arguments, text, client, mongo, Discord) => {
    const week = Number(arguments[0]);

    if (Number.isNaN(week) || week < 1 || week > 18) {
      return message.reply('Sorry, that week is invalid.');
    }

    try {
      await mongo();

      const scheduleData = await scheduleSchema.findOne({
        week: String(week)
      });

      if (
        !scheduleData ||
        !Array.isArray(scheduleData.games) ||
        scheduleData.games.length < 2
      ) {
        return message.reply(
          `I couldn't find the NFL schedule for Week ${week}.`
        );
      }

      const numberOfGames = scheduleData.games.length / 2;

      const embed = new Discord.EmbedBuilder()
        .setTitle(`🏈 1st & 10 NFL Pick'em — Week ${week}`)
        .setDescription(
          `**Week ${week} Pick'em is OPEN!**\n\n` +
          `There are **${numberOfGames} NFL games** to pick this week.\n\n` +
          `Click **Make My Picks** below and the bot will walk you through every matchup one game at a time.\n\n` +
          `Your selections are saved under your Discord account.\n\n` +
          `You can change your picks by clicking the button again and completing a new card.`
        )
        .setColor(0x013369)
        .addFields(
          {
            name: '🎯 How It Works',
            value:
              'Click the button → Pick every game → Submit your card automatically.'
          },
          {
            name: '👀 Review Your Picks',
            value:
              `After submitting, use \`!seePicks ${week}\` to review your selections.`
          },
          {
            name: '🏆 Season Standings',
            value:
              'Use `!pickemleaderboard` to view the season leaderboard.'
          }
        )
        .setFooter({
          text: '1st & 10 Madden Nation • NFL Pick’em'
        });

      const button = new Discord.ButtonBuilder()
        .setCustomId(`pickem_start_${week}`)
        .setLabel('Make My Picks')
        .setEmoji('🏈')
        .setStyle(Discord.ButtonStyle.Success);

      const row = new Discord.ActionRowBuilder()
        .addComponents(button);

      await message.channel.send({
        embeds: [embed],
        components: [row]
      });

      try {
        await message.delete();
      } catch (error) {
        // If the bot cannot delete the command message, just leave it.
      }

    } catch (error) {
      console.error('postPickem command error:', error);

      return message.reply(
        'There was an error posting the weekly Pick’em panel.'
      );
    }
  }
};
