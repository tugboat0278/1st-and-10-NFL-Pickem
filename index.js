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

/*
  KNOWN DISCORD EMOJI IDS

  The Cowboys emoji was verified directly
  through the bot on September 6, 2026.

  This gives the bot a reliable ID fallback
  in addition to looking up emojis by name.
*/
const emojiIdOverrides = {
  Dal: '1546282120454864927'
};

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

/*
  TEAM / EMOJI LOOKUP

  The bot now:
  1. Cleans the team code.
  2. Finds the NFL team code without caring
     about capitalization.
  3. Checks a verified emoji ID first when
     one is available.
  4. Checks the exact emoji name.
  5. Uses a normalized-name fallback.
*/
const getTeamInfo = (guild, teamCode) => {
  const cleanCode =
    String(teamCode || '').trim();

  const teamKey =
    Object.keys(nfl.nfl).find(
      key =>
        key.toLowerCase() ===
        cleanCode.toLowerCase()
    ) || cleanCode;

  const team =
    nfl.nfl[teamKey];

  let emoji = null;

  const overrideId =
    emojiIdOverrides[teamKey];

  if (overrideId) {
    emoji =
      guild.emojis.cache.get(
        overrideId
      ) || null;
  }

  if (
    !emoji &&
    team?.emojiName
  ) {
    emoji =
      guild.emojis.cache.find(
        guildEmoji =>
          guildEmoji.name ===
          team.emojiName
      ) || null;
  }

  if (
    !emoji &&
    team?.emojiName
  ) {
    const normalizeEmojiName =
      value =>
        String(value || '')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '');

    const wantedName =
      normalizeEmojiName(
        team.emojiName
      );

    emoji =
      guild.emojis.cache.find(
        guildEmoji =>
          normalizeEmojiName(
            guildEmoji.name
          ) === wantedName
      ) || null;
  }

  const emojiText = emoji
    ? emoji.animated
      ? `<a:${emoji.name}:${emoji.id}>`
      : `<:${emoji.name}:${emoji.id}>`
    : '';

  return {
    code: teamKey,
    name:
      team?.name ||
      cleanCode.toUpperCase(),
    emoji,
    emojiText
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

  true  = game is still open
  false = game has kicked off

  If kickoff information is unavailable,
  the game stays open and the commissioner
  can still use the manual weekly lock.
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

  const kickoffTime =
    new Date(kickoffData.kickoff);

  if (
    Number.isNaN(
      kickoffTime.getTime()
    )
  ) {
    console.error(
      `Invalid kickoff time for Week ${week}, Game ${gameNumber}`
    );

    return true;
  }

  return Date.now() <
    kickoffTime.getTime();
};

const getNextOpenGameIndex = (
  week,
  games,
  startingIndex
) => {
  const numberOfGames =
    games.length / 2;

  for (
    let index = startingIndex;
    index < numberOfGames;
    index++
  ) {
    if (
      isGameOpen(
        week,
        index
      )
    ) {
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
  const numberOfGames =
    games.length / 2;

  const awayCode =
    games[gameIndex * 2];

  const homeCode =
    games[(gameIndex * 2) + 1];

  const away =
    getTeamInfo(
      guild,
      awayCode
    );

  const home =
    getTeamInfo(
      guild,
      homeCode
    );

  const awayDisplay =
    away.emojiText
      ? `${away.emojiText} **${away.name}**`
      : `**${away.name}**`;

  const homeDisplay =
    home.emojiText
      ? `${home.emojiText} **${home.name}**`
      : `**${home.name}**`;

  const embed =
    new EmbedBuilder()
      .setTitle(
        `🏈 Week ${week} Pick'em`
      )
      .setDescription(
        `**Game ${gameIndex + 1} of ${numberOfGames}**\n\n` +
        `${awayDisplay}\n` +
        `**at**\n` +
        `${homeDisplay}\n\n` +
        '**Who wins?**\n\n' +
        '🔒 This matchup automatically locks at kickoff.'
      )
      .setColor(
        0x013369
      )
      .setFooter({
        text:
          '1st & 10 Madden Nation • NFL Pick’em'
      });

  const awayButton =
    new ButtonBuilder()
      .setCustomId(
        `pickem_choice_${userId}_${week}_${gameIndex}_${away.code}`
      )
      .setLabel(
        away.name
      )
      .setStyle(
        ButtonStyle.Primary
      );

  const homeButton =
    new ButtonBuilder()
      .setCustomId(
        `pickem_choice_${userId}_${week}_${gameIndex}_${home.code}`
      )
      .setLabel(
        home.name
      )
      .setStyle(
        ButtonStyle.Primary
      );

  if (away.emoji) {
    awayButton.setEmoji({
      id: away.emoji.id,
      name: away.emoji.name,
      animated:
        away.emoji.animated
    });
  }

  if (home.emoji) {
    homeButton.setEmoji({
      id: home.emoji.id,
      name: home.emoji.name,
      animated:
        home.emoji.animated
    });
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

/*
  SAVE OR CHANGE ONE PICK

  IMPORTANT:
  picks is a MongoDB Mixed object.

  Instead of updating "picks.1" directly,
  we load the existing picks object,
  change only the selected game,
  and save the full object back.

  This allows members to change an
  unlocked pick without wiping out
  their other selections.
*/
const saveSinglePick = async (
  discordUser,
  week,
  gameIndex,
  selectedTeam
) => {
  const weekKey =
    String(week);

  let user =
    await userSchema.findOne({
      id: discordUser.id
    }).lean();

  let picksObject = {};

  if (
    user?.picks &&
    typeof user.picks ===
      'object' &&
    !Array.isArray(
      user.picks
    )
  ) {
    picksObject = {
      ...user.picks
    };
  }

  let existingPicks = [];

  if (
    Array.isArray(
      picksObject[weekKey]
    )
  ) {
    existingPicks = [
      ...picksObject[weekKey]
    ];
  }

  existingPicks[gameIndex] =
    selectedTeam;

  picksObject[weekKey] =
    existingPicks;

  await userSchema.updateOne(
    {
      id: discordUser.id
    },
    {
      $set: {
        name:
          discordUser.username,
        picks:
          picksObject
      },
      $setOnInsert: {
        scores: {}
      }
    },
    {
      upsert: true
    }
  );

  return existingPicks;
};

client.on(
  'interactionCreate',
  async interaction => {
    if (
      !interaction.isButton()
    ) {
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
          interaction.customId.split(
            '_'
          );

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
          await isPickemOpen(
            week
          );

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
          return interaction.reply({
            content:
              `🔒 Week ${week} Pick'em is CLOSED.\n\n` +
              'Picks can no longer be submitted or changed.',
            ephemeral: true
          });
        }

        const scheduleData =
          await scheduleSchema.findOne({
            week:
              String(week)
          });

        if (
          !scheduleData ||
          !Array.isArray(
            scheduleData.games
          ) ||
          scheduleData.games.length <
            2
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
          START WITH THE FIRST GAME
          THAT HAS NOT KICKED OFF.

          Any earlier games are automatically
          skipped and cannot be changed.
        */
        const firstOpenGame =
          getNextOpenGameIndex(
            week,
            games,
            0
          );

        if (
          firstOpenGame === -1
        ) {
          return interaction.reply({
            content:
              `🔒 Every Week ${week} game has already kicked off.\n\n` +
              'No more picks can be submitted or changed.',
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
        MEMBER CLICKS A TEAM BUTTON
      */
      if (
        interaction.customId.startsWith(
          'pickem_choice_'
        )
      ) {
        const parts =
          interaction.customId.split(
            '_'
          );

        const userId =
          parts[2];

        const week =
          Number(parts[3]);

        const selectedGameIndex =
          Number(parts[4]);

        const selectedTeam =
          parts[5];

        /*
          MAKE SURE THIS BUTTON
          BELONGS TO THIS MEMBER
        */
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
          await isPickemOpen(
            week
          );

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
          CHECK THIS SPECIFIC
          GAME'S KICKOFF

          This happens again at the exact
          moment the member clicks a team.

          So even if they opened the picker
          before kickoff but waited until
          after kickoff to click, the game
          still cannot be changed.
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

          /*
            SKIP THE GAME THAT
            JUST LOCKED AND MOVE
            TO THE NEXT OPEN GAME
          */
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
          SAVE OR CHANGE THIS PICK
          IMMEDIATELY.

          An existing pick for this game
          is replaced only if the game
          has NOT kicked off.

          Picks for every other game
          remain untouched.
        */
        await saveSinglePick(
          interaction.user,
          week,
          selectedGameIndex,
          selectedTeam
        );

        /*
          FIND THE NEXT GAME
          THAT HAS NOT KICKED OFF
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
                'You may change any pick until that game kicks off.\n\n' +
                'Once a game begins, that matchup is permanently locked.\n\n' +
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

        /*
          MOVE TO NEXT OPEN GAME
        */
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
