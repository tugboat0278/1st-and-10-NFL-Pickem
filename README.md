# 🏈 1st & 10 NFL Pick'em Bot

Private NFL Pick'em bot for the **1st & 10 Madden Nation** Discord server.

## Purpose

This bot runs our weekly NFL Pick'em competition using the real NFL season.

League members make their picks for every NFL game each week, earn points for correct picks, and compete on the season leaderboard.

The regular season supports **Weeks 1–18**.

---

# Player Commands

## !schedule

Shows the NFL schedule for the selected week.

Example:

`!schedule 1`

---

## !makePicks

Submit your picks for every game that week.

Example:

`!makePicks 1 1,4,5,8,10,12,14,16`

You must select exactly **one winner from every matchup**.

Your picks are saved to your account and can be changed by submitting the command again.

---

## !seePicks

Shows your saved picks for the selected week.

Example:

`!seePicks 1`

---

## !seePoints

Shows everyone's scores for the selected week.

Example:

`!seePoints 1`

---

## !pickemleaderboard

Shows the overall **1st & 10 NFL Pick'em season standings**.

Example:

`!pickemleaderboard`

---

# Commissioner Commands

These commands require Discord Administrator permission.

## !setWinners

Enters the winning teams for the selected week.

Winners must be entered in the same order as the games on that week's schedule.

---

## !setWinners WEEK clear

Clears the picks, winners, and scores for a selected week.

Example:

`!setWinners 1 clear`

**WARNING:** This completely resets the Pick'em data for that week.

---

## !setPoints

Calculates everyone's points for the selected week after the winners have been entered.

The command also supports bonus games.

---

## !setTeamPicks

Allows an administrator to enter or correct picks for a member.

---

## !callout

Checks which existing Pick'em participants have not submitted their picks for the selected week.

**Note:** The bot can only check members who already have a Pick'em record in the database.

---

# Season Format

The bot currently supports the **18-week NFL regular season**.

NFL postseason support will be added separately for:

- Wild Card Round
- Divisional Round
- Conference Championships
- Super Bowl

This keeps postseason Pick'em separate from the regular-season Week 1–18 structure.

---

# Technology

Built with:

- Node.js
- Discord.js
- MongoDB
- Mongoose

---

# Required Environment Variables

`DJS_TOKEN` — Discord bot token

`MONGO_URI` — MongoDB connection string

**Never store either secret directly in this GitHub repository.**

---

# 1st & 10 Madden Nation

This project is based on the original **FantasyFootballPickEm** project and has been updated and customized for **1st & 10 Madden Nation**.
