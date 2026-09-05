# 1st & 10 NFL Pick'em Bot

Private NFL Pick'em bot for the **1st & 10 Madden Nation** Discord server.

## Purpose

This bot runs our weekly NFL Pick'em competition using the real NFL season.

League members make their picks for every NFL game each week, earn points for correct picks, and compete on the season leaderboard.

## Player Commands

### !schedule <week>
Shows the NFL schedule for the selected week.

Example:
`!schedule 1`

### !makePicks <week> <picks>
Submit your picks for every game that week.

Example:
`!makePicks 1 1,4,5,8`

You must select exactly one winner from every matchup.

### !seePicks <week>
Shows your saved picks for that week.

Example:
`!seePicks 1`

### !seePoints <week>
Shows everyone's scores for that week.

Example:
`!seePoints 1`

### !leaderboard
Shows the overall season standings.

## Commissioner Commands

These commands require Discord Administrator permission.

### !setWinners <week> <winners>
Enters the winning teams for the selected week.

### !setPoints <week> <bonus games> <points>
Calculates everyone's points for the selected week.

### !setTeamPicks <week> <team> <picks>
Allows an administrator to enter or correct picks for a member.

### !callout <week>
Mentions members who have not submitted their picks for that week.

## Technology

Built with:

- Node.js
- Discord.js
- MongoDB
- Mongoose

## Required Environment Variables

`DJS_TOKEN` — Discord bot token

`MONGO_URI` — MongoDB connection string

**Never store either secret directly in this GitHub repository.**

## 1st & 10 Madden Nation

This project is based on the original FantasyFootballPickEm project and has been updated and customized for **1st & 10 Madden Nation**.
