const { PermissionsBitField } = require('discord.js');

const allCommands = {};

const legacyPermissionName = (permission) => {
  if (PermissionsBitField.Flags[permission]) {
    return permission;
  }

  return permission
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
};

module.exports = (commandOptions) => {
  let {
    commands,
    permissions = []
  } = commandOptions;

  if (typeof commands === 'string') {
    commands = [commands];
  }

  if (typeof permissions === 'string') {
    permissions = [permissions];
  }

  console.log(`Registering command "${commands[0]}"`);

  for (const command of commands) {
    allCommands[command.toLowerCase()] = {
      ...commandOptions,
      commands,
      permissions
    };
  }
};

module.exports.listen = (client, mongo, Discord) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.guild) return;

    const { member, content, guild } = message;

    const args = content.trim().split(/\s+/);
    const name = args.shift().toLowerCase();

    if (!name.startsWith('!')) return;

    const commandName = name.slice(1);
    const command = allCommands[commandName];

    if (!command) return;

    const {
      permissions = [],
      permissionError = 'You do not have permission to run this command.',
      requiredRoles = [],
      minArgs = 0,
      maxArgs = null,
      expectedArgs = '',
      alias,
      callback
    } = command;

    for (const permission of permissions) {
      const permissionName = legacyPermissionName(permission);
      const permissionFlag = PermissionsBitField.Flags[permissionName];

      if (!permissionFlag || !member.permissions.has(permissionFlag)) {
        await message.reply(permissionError);
        return;
      }
    }

    for (const requiredRole of requiredRoles) {
      const role = guild.roles.cache.find(
        role => role.name === requiredRole
      );

      if (!role || !member.roles.cache.has(role.id)) {
        await message.reply(
          `You must have the "${requiredRole}" role to use this command`
        );
        return;
      }
    }

    if (
      args.length < minArgs ||
      (maxArgs !== null && args.length > maxArgs)
    ) {
      const commandHelp = alias || commandName;

      await message.reply(
        `Incorrect syntax. Use !${commandHelp} ${expectedArgs}`.trim()
      );
      return;
    }

    try {
      await callback(
        message,
        args,
        args.join(' '),
        client,
        mongo,
        Discord
      );
    } catch (error) {
      console.error(`Error running !${commandName}:`, error);

      await message.reply(
        'There was an error while running that command.'
      );
    }
  });
};
