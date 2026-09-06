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
  ],

  2: [
    // Thursday, September 17
    // DET @ BUF
    { game: 1, kickoff: '2026-09-17T20:15:00-04:00' },

    // Sunday, September 20 — 1:00 PM ET
    // MIN @ CHI
    { game: 2, kickoff: '2026-09-20T13:00:00-04:00' },

    // PHI @ TEN
    { game: 3, kickoff: '2026-09-20T13:00:00-04:00' },

    // GB @ NYJ
    { game: 4, kickoff: '2026-09-20T13:00:00-04:00' },

    // CAR @ ATL
    { game: 5, kickoff: '2026-09-20T13:00:00-04:00' },

    // NO @ BAL
    { game: 6, kickoff: '2026-09-20T13:00:00-04:00' },

    // CIN @ HOU
    { game: 7, kickoff: '2026-09-20T13:00:00-04:00' },

    // CLE @ TB
    { game: 8, kickoff: '2026-09-20T13:00:00-04:00' },

    // PIT @ NE
    { game: 9, kickoff: '2026-09-20T13:00:00-04:00' },

    // Sunday, September 20 — 4:05 PM ET
    // LV @ LAC
    { game: 10, kickoff: '2026-09-20T16:05:00-04:00' },

    // JAX @ DEN
    { game: 11, kickoff: '2026-09-20T16:05:00-04:00' },

    // Sunday, September 20 — 4:25 PM ET
    // WAS @ DAL
    { game: 12, kickoff: '2026-09-20T16:25:00-04:00' },

    // SEA @ ARI
    { game: 13, kickoff: '2026-09-20T16:25:00-04:00' },

    // MIA @ SF
    { game: 14, kickoff: '2026-09-20T16:25:00-04:00' },

    // Sunday Night Football
    // IND @ KC
    { game: 15, kickoff: '2026-09-20T20:20:00-04:00' },

    // Monday Night Football
    // NYG @ LAR
    { game: 16, kickoff: '2026-09-21T20:15:00-04:00' }
  ]
};
