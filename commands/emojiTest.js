const nfl = require('../NFL_Teams.js');

module.exports = {
  commands: ['emojitest'],
  alias: 'emojitest',
  expectedArgs: '',
  minArgs: 0,
  maxArgs: 0,

  callback: async (message) => {
    const emojis = message.guild.emojis.cache;

    const cowboysInfo = nfl.nfl.Dal;

    const exactName = cowboysInfo?.emojiName;

    const exactEmoji = exactName
      ? emojis.find(
          emoji => emoji.name === exactName
        )
      : null;

    return message.reply(
      `**Cowboys Pick'em Emoji Test**\n\n` +
      `Team code: \`Dal\`\n` +
      `Team name from NFL_Teams.js: \`${cowboysInfo?.name || 'NOT FOUND'}\`\n` +
      `Emoji name from NFL_Teams.js: \`${exactName || 'NOT FOUND'}\`\n` +
      `Exact Discord emoji match: ${exactEmoji ? `YES ${exactEmoji}` : 'NO'}\n` +
      `Emoji ID: \`${exactEmoji?.id || 'NOT FOUND'}\``
    );
  }
};
