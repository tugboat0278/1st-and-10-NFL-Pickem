module.exports = {
  commands: ['pickemhelp'],
  alias: 'pickemHelp',

  callback: async (message, arguments, text, client, mongo, Discord) => {
    const embed = new Discord.EmbedBuilder()
      .setTitle("🏈 1st & 10 NFL Pick'em — Help")
      .setDescription(
        "**Welcome to the 1st & 10 Madden Nation NFL Pick'em!**\n\n" +
        "Pick the winner of every NFL game each week and compete for the season championship."
      )
      .setColor(0x013369)

      .addFields(
        {
          name: '📅 !schedule <week>',
          value:
            'Shows all NFL games for that week.\n' +
            'Example: `!schedule 1`'
        },
        {
          name: '🏈 !makePicks <week> <picks>',
          value:
            'Submit one winner from every matchup.\n' +
            'Example: `!makePicks 1 1,4,5,8...`'
        },
        {
          name: '👀 !seePicks <week>',
          value:
            'Shows the picks you submitted.\n' +
            'Example: `!seePicks 1`'
        },
        {
          name: '📊 !seePoints <week>',
          value:
            "Shows everyone's scores for that week.\n" +
            'Example: `!seePoints 1`'
        },
        {
          name: '🏆 !pickemleaderboard',
          value:
            'Shows the overall season standings.'
        }
      )

      .setFooter({
        text: '1st & 10 Madden Nation • NFL Pick’em'
      });

    return message.channel.send({
      embeds: [embed]
    });
  }
};
