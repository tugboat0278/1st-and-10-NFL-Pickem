const Discord = require('discord.js');

const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} = Discord;

const mongo = require('./mongo.js');
const scheduleSchema = require('./schemas/schedule-schema');
const userSchema = require('./schemas/user-schema');
const nfl = require('./NFL_Teams.js');

const path = require('path');
const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

const baseFile = 'command-base.js';
const commandBase = require(`./commands/${baseFile}`);

const activePickems = new Map();

const readCommands = (dir) => {
  const files = fs.readdirSync(path.join(__dirname, dir));

  for (const file of files) {
    const stat = fs.lstatSync(path.join(__dirname, dir, file));

    if (stat.isDirectory()) {
      readCommands(path.join(dir, file));
    } else if (file !== baseFile) {
      const option = require(path.join(__dirname, dir, file));
      commandBase(option);
    }
  }
};

const getTeamInfo = (guild, teamCode) => {
  const team = nfl.nfl[teamCode];

  return {
    code: teamCode,
    name: team?.name || teamCode.toUpperCase(),
    emoji: team?.emojiName
      ? guild.emojis.cache.find(
          emoji => emoji.name === team.emojiName
        )
      : null
  };
};

const buildPickemGame = (
  guild,
  userId,
  week,
  games,
  gameIndex
) => {
  const numberOfGames = games.length / 2;

  const awayCode = games[gameIndex * 2];
  const homeCode = games[(gameIndex * 2) + 1];

  const away = getTeamInfo(guild, awayCode);
  const home = getTeamInfo(guild, homeCode);

  const awayDisplay = away.emoji
    ? `${away.emoji} **${away.name}**`
    : `**${away.name}**`;

  const homeDisplay = home.emoji
    ? `${home.emoji} **${home.name}**`
    : `**${home.name}**`;

  const embed = new EmbedBuilder()
    .setTitle(`🏈 Week ${week} Pick'em`)
    .setDescription(
      `**Game ${gameIndex + 1} of ${numberOfGames}**\n\n` +
      `${awayDisplay}\n` +
      `**at**\n` +
      `${homeDisplay}\n\n` +
      '**Who wins?**'
    )
    .setColor(0x013369)
    .setFooter({
      text: '1st & 10 Madden Nation • NFL Pick’em'
    });

  const awayButton = new ButtonBuilder()
    .setCustomId(
      `pickem_choice_${userId}_${week}_${gameIndex}_${awayCode}`
    )
    .setLabel(away.name)
    .setStyle(ButtonStyle.Primary);

  const homeButton = new ButtonBuilder()
    .setCustomId(
      `pickem_choice_${userId}_${week}_${gameIndex}_${homeCode}`
    )
    .setLabel(home.name)
    .setStyle(ButtonStyle.Primary);

  if (away.emoji) {
    awayButton.setEmoji(away.emoji.id);
  }

  if (home.emoji) {
    homeButton.setEmoji(home.emoji.id);
  }

  const row = new ActionRowBuilder()
    .addComponents(
      awayButton,
      homeButton
    );

  return {
    embeds: [embed],
    components: [row]
  };
};

const isPickemOpen = async (week) => {
  const scheduleData =
    await scheduleSchema.collection.findOne({
      week: String(week)
    });

  if (!scheduleData) {
    return null;
  }

  return scheduleData.pickemOpen !== false;
};

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) {
    return;
  }

  try {
    /*
      MEMBER CLICKS THE PUBLIC
      "MAKE MY PICKS" BUTTON
    */
    if (
      interaction.customId.startsWith(
        'pickem_start_'
      )
    ) {
      const parts =
        interaction.customId.split('_');

      const week = Number(parts[2]);

      if (
        Number.isNaN(week) ||
        week < 1 ||
        week > 18
      ) {
        return interaction.reply({
          content:
            'Sorry, that Pick’em week is invalid.',
          ephemeral: true
        });
      }

      await mongo();

      const pickemOpen =
        await isPickemOpen(week);

      if (pickemOpen === null) {
        return interaction.reply({
          content:
            `I couldn't find the NFL schedule for Week ${week}.`,
          ephemeral: true
        });
      }

      if (!pickemOpen) {
        return interaction.reply({
          content:
            `🔒 Week ${week} Pick'em is CLOSED.\n\n` +
            'Picks can no longer be submitted or changed.',
          ephemeral: true
        });
      }

      const scheduleData =
        await scheduleSchema.findOne({
          week: String(week)
        });

      if (
        !scheduleData ||
        !Array.isArray(scheduleData.games) ||
        scheduleData.games.length < 2
      ) {
        return interaction.reply({
          content:
            `I couldn't find the NFL schedule for Week ${week}.`,
          ephemeral: true
        });
      }

      const sessionKey =
        `${interaction.user.id}_${week}`;

      activePickems.set(sessionKey, {
        week,
        games: scheduleData.games,
        picks: [],
        gameIndex: 0
      });

      const firstGame = buildPickemGame(
        interaction.guild,
        interaction.user.id,
        week,
        scheduleData.games,
        0
      );

      return interaction.reply({
        ...firstGame,
        ephemeral: true
      });
    }

    /*
      MEMBER CLICKS A TEAM BUTTON
    */
    if (
      interaction.customId.startsWith(
        'pickem_choice_'
      )
    ) {
      const parts =
        interaction.customId.split('_');

      const userId = parts[2];
      const week = Number(parts[3]);
      const selectedGameIndex =
        Number(parts[4]);
      const selectedTeam = parts[5];

      if (
        interaction.user.id !== userId
      ) {
        return interaction.reply({
          content:
            'This Pick’em session belongs to another member.',
          ephemeral: true
        });
      }

      await mongo();

      /*
        CHECK THE LOCK AGAIN BEFORE
        ALLOWING EACH PICK
      */
      const pickemOpen =
        await isPickemOpen(week);

      if (pickemOpen === null) {
        return interaction.reply({
          content:
            `I couldn't find the NFL schedule for Week ${week}.`,
          ephemeral: true
        });
      }

      if (!pickemOpen) {
        const sessionKey =
          `${userId}_${week}`;

        activePickems.delete(sessionKey);

        return interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(
                `🔒 Week ${week} Pick'em Closed`
              )
              .setDescription(
                'The commissioner has closed Pick’em for this week.\n\n' +
                'No additional picks or changes can be submitted.'
              )
              .setColor(0x808080)
              .setFooter({
                text:
                  '1st & 10 Madden Nation • NFL Pick’em'
              })
          ],
          components: []
        });
      }

      const sessionKey =
        `${userId}_${week}`;

      const session =
        activePickems.get(sessionKey);

      if (!session) {
        return interaction.reply({
          content:
            `Your Pick’em session is no longer active. ` +
            `Click **Make My Picks** on the Week ${week} panel to start again.`,
          ephemeral: true
        });
      }

      if (
        selectedGameIndex !==
        session.gameIndex
      ) {
        return interaction.reply({
          content:
            'That matchup has already been completed.',
          ephemeral: true
        });
      }

      session.picks[
        session.gameIndex
      ] = selectedTeam;

      session.gameIndex++;

      const numberOfGames =
        session.games.length / 2;

      /*
        MORE GAMES LEFT
      */
      if (
        session.gameIndex <
        numberOfGames
      ) {
        const nextGame =
          buildPickemGame(
            interaction.guild,
            interaction.user.id,
            week,
            session.games,
            session.gameIndex
          );

        activePickems.set(
          sessionKey,
          session
        );

        return interaction.update(
          nextGame
        );
      }

      /*
        CHECK LOCK ONE FINAL TIME
        BEFORE SAVING THE CARD
      */
      const finalLockCheck =
        await isPickemOpen(week);

      if (!finalLockCheck) {
        activePickems.delete(
          sessionKey
        );

        return interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(
                `🔒 Week ${week} Pick'em Closed`
              )
              .setDescription(
                'Pick’em closed before your card was submitted.\n\n' +
                'Your selections were not saved.'
              )
              .setColor(0x808080)
          ],
          components: []
        });
      }

      /*
        ALL PICKS COMPLETED
        SAVE THEM
      */
      let user =
        await userSchema.findOne({
          id: interaction.user.id
        });

      if (!user) {
        user = new userSchema({
          id: interaction.user.id,
          name:
            interaction.user.username,
          picks: {},
          scores: {}
        });

        await user.save();
      }

      await userSchema.updateOne(
        {
          id: interaction.user.id
        },
        {
          $set: {
            name:
              interaction.user.username,
            [`picks.${week}`]:
              session.picks
          }
        }
      );

      activePickems.delete(
        sessionKey
      );

      const completeEmbed =
        new EmbedBuilder()
          .setTitle(
            `✅ Week ${week} Picks Submitted!`
          )
          .setDescription(
            `You successfully picked all **${numberOfGames} games**.\n\n` +
            'Your picks have been saved under your Discord account.\n\n' +
            `Use \`!seePicks ${week}\` to review your selections.\n\n` +
            `If you want to change them, click **Make My Picks** on the Week ${week} panel again before Pick'em closes.`
          )
          .setColor(0x00a651)
          .setFooter({
            text:
              '1st & 10 Madden Nation • NFL Pick’em'
          });

      return interaction.update({
        embeds: [completeEmbed],
        components: []
      });
    }

  } catch (error) {
    console.error(
      'Pickem interaction error:',
      error
    );

    if (
      interaction.replied ||
      interaction.deferred
    ) {
      return interaction.followUp({
        content:
          'There was an error processing your Pick’em.',
        ephemeral: true
      });
    }

    return interaction.reply({
      content:
        'There was an error processing your Pick’em.',
      ephemeral: true
    });
  }
});

client.once('ready', () => {
  console.log(
    `1st & 10 NFL Pickem is online as ${client.user.tag}`
  );

  readCommands('commands');

  commandBase.listen(
    client,
    mongo,
    Discord
  );
});

client.login(
  process.env.DJS_TOKEN
);
