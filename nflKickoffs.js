// 2026 NFL KICKOFF TIMES
//
// This file controls automatic per-game pick locking.
//
// IMPORTANT:
// If the NFL changes a kickoff time, flexes a game,
// or announces a previously TBD game, update the
// kickoff time here and redeploy the bot.
//
// Times below use Eastern Time offsets.

module.exports = {
  1: [
    // Wednesday, September 9
    { game: 1, kickoff: '2026-09-09T20:20:00-04:00' },

    // Thursday, September 10
    { game: 2, kickoff: '2026-09-10T20:35:00-04:00' },

    // Sunday, September 13 — 1:00 PM ET
    { game: 3, kickoff: '2026-09-13T13:00:00-04:00' },
    { game: 4, kickoff: '2026-09-13T13:00:00-04:00' },
    { game: 5, kickoff: '2026-09-13T13:00:00-04:00' },
    { game: 6, kickoff: '2026-09-13T13:00:00-04:00' },
    { game: 7, kickoff: '2026-09-13T13:00:00-04:00' },
    { game: 8, kickoff: '2026-09-13T13:00:00-04:00' },
    { game: 9, kickoff: '2026-09-13T13:00:00-04:00' },
    { game: 10, kickoff: '2026-09-13T13:00:00-04:00' },

    // Sunday, September 13 — 4:25 PM ET
    { game: 11, kickoff: '2026-09-13T16:25:00-04:00' },
    { game: 12, kickoff: '2026-09-13T16:25:00-04:00' },
    { game: 13, kickoff: '2026-09-13T16:25:00-04:00' },
    { game: 14, kickoff: '2026-09-13T16:25:00-04:00' },

    // Sunday Night Football
    { game: 15, kickoff: '2026-09-13T20:20:00-04:00' },

    // Monday Night Football
    { game: 16, kickoff: '2026-09-14T20:15:00-04:00' }
  ]
};
