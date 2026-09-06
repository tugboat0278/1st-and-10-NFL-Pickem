module.exports = {
  commands: ['emojitest'],
  alias: 'emojitest',
  expectedArgs: '',
  minArgs: 0,
  maxArgs: 0,

  callback: async (message) => {
    const emojis = message.guild.emojis.cache;

    const exactName = 'Dallas_Cowboys_logo';

    const exactEmoji = emojis.find(
      emoji => emoji.name === exactName
    );

    const cowboyEmojis = emojis.filter(
      emoji =>
        emoji.name.toLowerCase().includes('dallas') ||
        emoji.name.toLowerCase().includes('cowboy')
    );

    const foundNames = cowboyEmojis.size
      ? cowboyEmojis.map(
          emoji => `${emoji.name} — ID: ${emoji.id}`
        ).join('\n')
      : 'NONE';

    return message.reply(
      `**Cowboys Emoji Test**\n\n` +
      `Looking for: \`${exactName}\`\n` +
      `Exact match: ${exactEmoji ? `YES ${exactEmoji}` : 'NO'}\n\n` +
      `Cowboys/Dallas emojis visible to bot:\n${foundNames}`
    );
  }
};
