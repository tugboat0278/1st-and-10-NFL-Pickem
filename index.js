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
const nflKickoffs = require('./nflKickoffs.js');

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

/*
  WHOLE-WEEK COMMISSIONER LOCK
*/
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

/*
  INDIVIDUAL GAME KICKOFF LOCK

  Returns:
  true  = game can still be picked
  false = game has kicked off and is locked

  If kickoff information has not yet been added for a week,
  the game remains open and the commissioner lock still works.
*/
const isGameOpen = (week, gameIndex) => {
  const weekKickoffs = nflKickoffs[week];

  if (!Array.isArray(weekKickoffs)) {
    return true;
  }

  const gameNumber = gameIndex + 1;

  const kickoffData = weekKickoffs.find(
    item => Number(item.game) === gameNumber
  );

  if (!kickoffData?.kickoff) {
    return true;
  }

  const kickoffTime = new Date(kickoffData.kickoff);

  if (Number.isNaN(kickoffTime.getTime())) {
    console.error(
      `Invalid kickoff time for Week ${week}, Game ${gameNumber}`
    );

    return true;
  }

  return Date.now() < kickoffTime.getTime();
};

const getNextOpenGameIndex = (
  week,
  games,
  startingIndex
) => {
  const numberOfGames = games.length / 2;

  for (
    let index = startingIndex;
    index < numberOfGames;
    index++
  ) {
    if (isGameOpen(week, index)) {
      return index;
    }
  }

  return -1;
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

  const away = getTeamInfo(
    guild,
    awayCode
  );

  const home = getTeamInfo(
    guild,
    homeCode
  );

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
      '**Who wins?**\n\n' +
      '🔒 This matchup automatically locks at kickoff.'
    )
    .setColor(0x013369)
    .setFooter({
      text:
        '1st & 10 Madden Nation • NFL Pick’em'
    });

  const awayButton =
    new ButtonBuilder()
      .setCustomId(
        `pickem_choice_${userId}_${week}_${gameIndex}_${awayCode}`
      )
      .setLabel(away.name)
      .setStyle(ButtonStyle.Primary);

  const homeButton =
    new ButtonBuilder()
      .setCustomId(
        `pickem_choice_${userId}_${week}_${gameIndex}_${homeCode}`
      )
      .setLabel(home.name)
      .setStyle(ButtonStyle.Primary);

  if (away.emoji) {
    awayButton.setEmoji(
      away.emoji.id
    );
  }

  if (home.emoji) {
    homeButton.setEmoji(
      home.emoji.id
    );
  }

  const row =
    new ActionRowBuilder()
      .addComponents(
        awayButton,
        homeButton
      );

  return {
    embeds: [embed],
    components: [row]
  };
};

const saveSinglePick = async (
  discordUser,
  week,
  gameIndex,
  selectedTeam
) => {
  let user =
    await userSchema.findOne({
      id: discordUser.id
    });

  if (!user) {
    user = new userSchema({
      id: discordUser.id,
      name: discordUser.username,
      picks: {},
      scores: {}
    });

    await user.save();
  }

  let existingPicks =
    user.picks?.[week];

  if (!Array.isArray(existingPicks)) {
    existingPicks = [];
  }

  existingPicks[gameIndex] =
    selectedTeam;

  await userSchema.updateOne(
    {
      id: discordUser.id
    },
    {
      $set: {
        name:
          discordUser.username,
        [`picks.${week}`]:
          existingPicks
      }
    }
  );

  return existingPicks;
};

client.on(
  'interactionCreate',
  async interaction => {
    if (!interaction.isButton()) {
      return;
    }

    try {
      /*
        MEMBER CLICKS PUBLIC
        "MAKE MY PICKS"
      */
      if (
        interaction.customId.startsWith(
          'pickem_start_'
        )
      ) {
        const parts =
          interaction.customId.split('_');

        const week =
          Number(parts[2]);

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

        /*
          CHECK COMMISSIONER LOCK
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
          !Array.isArray(
            scheduleData.games
          ) ||
          scheduleData.games.length < 2
        ) {
          return interaction.reply({
            content:
              `I couldn't find the NFL schedule for Week ${week}.`,
            ephemeral: true
          });
        }

        const games =
          scheduleData.games;

        /*
          FIND FIRST GAME THAT
          HAS NOT KICKED OFF
        */
        const firstOpenGame =
          getNextOpenGameIndex(
            week,
            games,
            0
          );

        if (firstOpenGame === -1) {
          return interaction.reply({
            content:
              `🔒 Every Week ${week} game has already kicked off.\n\n` +
              'No more picks can be submitted.',
            ephemeral: true
          });
        }

        const sessionKey =
          `${interaction.user.id}_${week}`;

        activePickems.set(
          sessionKey,
          {
            week,
            games,
            gameIndex:
              firstOpenGame
          }
        );

        const firstGame =
          buildPickemGame(
            interaction.guild,
            interaction.user.id,
            week,
            games,
            firstOpenGame
          );

        return interaction.reply({
          ...firstGame,
          ephemeral: true
        });
      }

      /*
        MEMBER CLICKS TEAM BUTTON
      */
      if (
        interaction.customId.startsWith(
          'pickem_choice_'
        )
      ) {
        const parts =
          interaction.customId.split('_');

        const userId =
          parts[2];

        const week =
          Number(parts[3]);

        const selectedGameIndex =
          Number(parts[4]);

        const selectedTeam =
          parts[5];

        if (
          interaction.user.id !==
          userId
        ) {
          return interaction.reply({
            content:
              'This Pick’em session belongs to another member.',
            ephemeral: true
          });
        }

        await mongo();

        /*
          CHECK COMMISSIONER LOCK
        */
        const pickemOpen =
          await isPickemOpen(week);

        if (
          pickemOpen === null
        ) {
          return interaction.reply({
            content:
              `I couldn't find the NFL schedule for Week ${week}.`,
            ephemeral: true
          });
        }

        if (!pickemOpen) {
          activePickems.delete(
            `${userId}_${week}`
          );

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
                .setColor(
                  0x808080
                )
                .setFooter({
                  text:
                    '1st & 10 Madden Nation • NFL Pick’em'
                })
            ],
            components: []
          });
        }

        /*
          CHECK THIS GAME'S
          REAL-LIFE KICKOFF
        */
        if (
          !isGameOpen(
            week,
            selectedGameIndex
          )
        ) {
          const sessionKey =
            `${userId}_${week}`;

          const session =
            activePickems.get(
              sessionKey
            );

          if (!session) {
            return interaction.update({
              embeds: [
                new EmbedBuilder()
                  .setTitle(
                    '🔒 Game Locked'
                  )
                  .setDescription(
                    `Game ${selectedGameIndex + 1} has already kicked off.\n\n` +
                    'That pick can no longer be submitted or changed.'
                  )
                  .setColor(
                    0x808080
                  )
              ],
              components: []
            });
          }

          const nextOpenGame =
            getNextOpenGameIndex(
              week,
              session.games,
              selectedGameIndex + 1
            );

          if (
            nextOpenGame === -1
          ) {
            activePickems.delete(
              sessionKey
            );

            return interaction.update({
              embeds: [
                new EmbedBuilder()
                  .setTitle(
                    `🔒 Week ${week} Picking Complete`
                  )
                  .setDescription(
                    'That matchup has already kicked off, and there are no remaining unlocked games.'
                  )
                  .setColor(
                    0x808080
                  )
              ],
              components: []
            });
          }

          session.gameIndex =
            nextOpenGame;

          activePickems.set(
            sessionKey,
            session
          );

          return interaction.update(
            buildPickemGame(
              interaction.guild,
              interaction.user.id,
              week,
              session.games,
              nextOpenGame
            )
          );
        }

        const sessionKey =
          `${userId}_${week}`;

        const session =
          activePickems.get(
            sessionKey
          );

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

        /*
          SAVE THIS PICK IMMEDIATELY

          This is important because it means
          completed picks remain saved even if
          another game kicks off while the member
          is still making the rest of the card.
        */
        await saveSinglePick(
          interaction.user,
          week,
          selectedGameIndex,
          selectedTeam
        );

        /*
          FIND NEXT GAME THAT
          HAS NOT KICKED OFF
        */
        const nextOpenGame =
          getNextOpenGameIndex(
            week,
            session.games,
            selectedGameIndex + 1
          );

        /*
          NO MORE OPEN GAMES
        */
        if (
          nextOpenGame === -1
        ) {
          activePickems.delete(
            sessionKey
          );

          const completeEmbed =
            new EmbedBuilder()
              .setTitle(
                `✅ Week ${week} Picks Saved!`
              )
              .setDescription(
                'Your available Week ' +
                `${week} picks have been saved.\n\n` +
                'Any game that has already kicked off is automatically locked.\n\n' +
                `Use \`!seePicks ${week}\` to review your selections.`
              )
              .setColor(
                0x00a651
              )
              .setFooter({
                text:
                  '1st & 10 Madden Nation • NFL Pick’em'
              });

          return interaction.update({
            embeds: [
              completeEmbed
            ],
            components: []
          });
        }

        session.gameIndex =
          nextOpenGame;

        activePickems.set(
          sessionKey,
          session
        );

        return interaction.update(
          buildPickemGame(
            interaction.guild,
            interaction.user.id,
            week,
            session.games,
            nextOpenGame
          )
        );
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
  }
);

client.once(
  'ready',
  () => {
    console.log(
      `1st & 10 NFL Pickem is online as ${client.user.tag}`
    );

    readCommands(
      'commands'
    );

    commandBase.listen(
      client,
      mongo,
      Discord
    );
  }
);

client.login(
  process.env.DJS_TOKEN
);
