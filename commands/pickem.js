const scheduleSchema = require('../schemas/schedule-schema');
const userSchema = require('../schemas/user-schema');
const nfl = require('../NFL_Teams.js');

module.exports = {
  commands: ['pickem'],
  alias: 'pickem',
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

      const scheduleData = await scheduleSchema.findOne({
        week: String(week)
      });

      if (!scheduleData || !Array.isArray(scheduleData.games)) {
        return message.reply(
          `I couldn't find the NFL schedule for Week ${week}.`
        );
      }

      const games = scheduleData.games;

      if (games.length < 2 || games.length % 2 !== 0) {
        return message.reply(
          `The Week ${week} schedule does not appear to be valid.`
        );
      }

      const numberOfGames = games.length / 2;
      const picks = [];
      let gameIndex = 0;

      const getTeamInfo = teamCode => {
        const team = nfl.nfl[teamCode];

        return {
          code: teamCode,
          name: team?.name || teamCode.toUpperCase(),
          emoji: team?.emojiName
            ? message.guild.emojis.cache.find(
                emoji => emoji.name === team.emojiName
              )
            : null
        };
      };

      const buildGame = index => {
        const awayCode = games[index * 2];
        const homeCode = games[(index * 2) + 1];

        const away = getTeamInfo(awayCode);
        const home = getTeamInfo(homeCode);

        const awayDisplay = away.emoji
          ? `${away.emoji} **${away.name}**`
          : `**${away.name}**`;

        const homeDisplay = home.emoji
          ? `${home.emoji} **${home.name}**`
          : `**${home.name}**`;

        const embed = new Discord.EmbedBuilder()
          .setTitle(`🏈 Week ${week} Pick'em`)
          .setDescription(
            `**Game ${index + 1} of ${numberOfGames}**\n\n` +
            `${awayDisplay}\n` +
            `**at**\n` +
            `${homeDisplay}\n\n` +
            '**Who wins?**'
          )
          .setColor(0x013369)
          .setFooter({
            text: '1st & 10 Madden Nation • NFL Pick’em'
          });

        const awayButton = new Discord.ButtonBuilder()
          .setCustomId(`pickem_${message.author.id}_${week}_${index}_${awayCode}`)
          .setLabel(away.name)
          .setStyle(Discord.ButtonStyle.Primary);

        const homeButton = new Discord.ButtonBuilder()
          .setCustomId(`pickem_${message.author.id}_${week}_${index}_${homeCode}`)
          .setLabel(home.name)
          .setStyle(Discord.ButtonStyle.Primary);

        if (away.emoji) {
          awayButton.setEmoji(away.emoji.id);
        }

        if (home.emoji) {
          homeButton.setEmoji(home.emoji.id);
        }

        const row = new Discord.ActionRowBuilder().addComponents(
          awayButton,
          homeButton
        );

        return {
          embeds: [embed],
          components: [row]
        };
      };

      const pickMessage = await message.channel.send(
        buildGame(gameIndex)
      );

      const collector = pickMessage.createMessageComponentCollector({
        filter: interaction =>
          interaction.user.id === message.author.id &&
          interaction.customId.startsWith(
            `pickem_${message.author.id}_${week}_`
          ),
        time: 15 * 60 * 1000
      });

      collector.on('collect', async interaction => {
        const parts = interaction.customId.split('_');

        const selectedGameIndex = Number(parts[3]);
        const selectedTeam = parts[4];

        if (selectedGameIndex !== gameIndex) {
          return interaction.reply({
            content: 'That matchup has already been completed.',
            ephemeral: true
          });
        }

        picks[gameIndex] = selectedTeam;
        gameIndex++;

        if (gameIndex < numberOfGames) {
          return interaction.update(
            buildGame(gameIndex)
          );
        }

        collector.stop('completed');

        let user = await userSchema.findOne({
          id: message.author.id
        });

        if (!user) {
          user = new userSchema({
            id: message.author.id,
            name: message.author.username,
            picks: {},
            scores: {}
          });

          await user.save();
        }

        await userSchema.updateOne(
          { id: message.author.id },
          {
            $set: {
              name: message.author.username,
              [`picks.${week}`]: picks
            }
          }
        );

        const completeEmbed = new Discord.EmbedBuilder()
          .setTitle(`✅ Week ${week} Picks Submitted!`)
          .setDescription(
            `You successfully picked all **${numberOfGames} games**.\n\n` +
            `Use \`!seePicks ${week}\` to review your selections.\n\n` +
            `If you want to change your picks, run \`!pickem ${week}\` again.`
          )
          .setColor(0x00a651)
          .setFooter({
            text: '1st & 10 Madden Nation • NFL Pick’em'
          });

        return interaction.update({
          embeds: [completeEmbed],
          components: []
        });
      });

      collector.on('end', async (collected, reason) => {
        if (reason === 'completed') {
          return;
        }

        try {
          const timeoutEmbed = new Discord.EmbedBuilder()
            .setTitle(`⏰ Week ${week} Pick'em Expired`)
            .setDescription(
              `Your Pick'em session expired before all games were selected.\n\n` +
              `Run \`!pickem ${week}\` again to start over.`
            )
            .setColor(0x808080);

          await pickMessage.edit({
            embeds: [timeoutEmbed],
            components: []
          });
        } catch (error) {
          console.error('Pickem timeout edit error:', error);
        }
      });

    } catch (error) {
      console.error('Pickem command error:', error);

      return message.reply(
        'There was an error starting the Pick’em.'
      );
    }
  }
};
