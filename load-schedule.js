const mongoose = require('mongoose');
const mongo = require('./mongo.js');
const Schedule = require('./schemas/schedule-schema');

const schedules = [
  {
    week: '1',
    games: [
      'Ne', 'Sea',
      'Sf', 'Lar',
      'Chi', 'Car',
      'Tb', 'Cin',
      'Bal', 'Ind',
      'Buf', 'Hou',
      'No', 'Det',
      'Nyj', 'Ten',
      'Atl', 'Pit',
      'Cle', 'Jax',
      'Ari', 'Lac',
      'Gb', 'Min',
      'Mia', 'Lv',
      'Was', 'Phi',
      'Dal', 'Nyg',
      'Den', 'Kc'
    ]
  },
  {
    week: '2',
    games: [
      'Det', 'Buf',
      'Min', 'Chi',
      'Phi', 'Ten',
      'Gb', 'Nyj',
      'Car', 'Atl',
      'No', 'Bal',
      'Cin', 'Hou',
      'Cle', 'Tb',
      'Pit', 'Ne',
      'Lv', 'Lac',
      'Jax', 'Den',
      'Was', 'Dal',
      'Sea', 'Ari',
      'Mia', 'Sf',
      'Ind', 'Kc',
      'Nyg', 'Lar'
    ]
  },
  {
    week: '3',
    games: [
      'Atl', 'Gb',
      'Kc', 'Mia',
      'Hou', 'Ind',
      'Ten', 'Nyg',
      'Ne', 'Jax',
      'Cin', 'Pit',
      'Car', 'Cle',
      'Nyj', 'Det',
      'Sea', 'Was',
      'Lac', 'Buf',
      'Min', 'Tb',
      'Ari', 'Sf',
      'Bal', 'Dal',
      'Lv', 'No',
      'Lar', 'Den',
      'Phi', 'Chi'
    ]
  },
  {
    week: '4',
    games: [
      'Pit', 'Cle',
      'Ind', 'Was',
      'Ten', 'Bal',
      'Ari', 'Nyg',
      'Jax', 'Cin',
      'Ne', 'Buf',
      'Dal', 'Hou',
      'Lar', 'Phi',
      'Gb', 'Tb',
      'Nyj', 'Chi',
      'Mia', 'Min',
      'Den', 'Sf',
      'Lac', 'Sea',
      'Kc', 'Lv',
      'Det', 'Car',
      'Atl', 'No'
    ]
  },
  {
    week: '5',
    games: [
      'Tb', 'Dal',
      'Phi', 'Jax',
      'Lv', 'Ne',
      'Hou', 'Ten',
      'Cle', 'Nyj',
      'Ind', 'Pit',
      'Cin', 'Mia',
      'Min', 'No',
      'Nyg', 'Was',
      'Den', 'Lac',
      'Chi', 'Gb',
      'Det', 'Ari',
      'Sf', 'Sea',
      'Bal', 'Atl',
      'Buf', 'Lar'
    ]
  },
  {
    week: '6',
    games: [
      'Sea', 'Den',
      'Hou', 'Jax',
      'Nyj', 'Ne',
      'Pit', 'Tb',
      'Car', 'Phi',
      'Chi', 'Atl',
      'Ten', 'Ind',
      'No', 'Nyg',
      'Bal', 'Cle',
      'Ari', 'Lar',
      'Lac', 'Kc',
      'Buf', 'Lv',
      'Dal', 'Gb',
      'Was', 'Sf'
    ]
  },
  {
    week: '7',
    games: [
      'Ne', 'Chi',
      'Pit', 'No',
      'Cle', 'Ten',
      'Mia', 'Nyj',
      'Ind', 'Min',
      'Cin', 'Bal',
      'Nyg', 'Hou',
      'Tb', 'Car',
      'Sf', 'Atl',
      'Den', 'Ari',
      'Lar', 'Lv',
      'Gb', 'Det',
      'Kc', 'Sea',
      'Dal', 'Phi'
    ]
  },
  {
    week: '8',
    games: [
      'Car', 'Gb',
      'Ten', 'Cin',
      'Ind', 'Jax',
      'Cle', 'Pit',
      'Bal', 'Buf',
      'Atl', 'Tb',
      'Min', 'Det',
      'Ari', 'Dal',
      'Lv', 'Nyj',
      'Lac', 'Lar',
      'Kc', 'Den',
      'Ne', 'Mia',
      'Phi', 'Was',
      'Chi', 'Sea'
    ]
  },
  {
    week: '9',
    games: [
      'Jax', 'Bal',
      'Cin', 'Atl',
      'Nyj', 'Kc',
      'Cle', 'No',
      'Den', 'Car',
      'Dal', 'Ind',
      'Det', 'Mia',
      'Nyg', 'Phi',
      'Lar', 'Was',
      'Lv', 'Sf',
      'Hou', 'Lac',
      'Ari', 'Sea',
      'Gb', 'Ne',
      'Tb', 'Chi',
      'Buf', 'Min'
    ]
  },
  {
    week: '10',
    games: [
      'Was', 'Nyg',
      'Ne', 'Det',
      'Buf', 'Nyj',
      'Mia', 'Ind',
      'Kc', 'Atl',
      'Min', 'Gb',
      'Jax', 'Ten',
      'Hou', 'Cle',
      'Car', 'No',
      'Lar', 'Ari',
      'Sea', 'Lv',
      'Sf', 'Dal',
      'Pit', 'Cin',
      'Lac', 'Bal'
    ]
  },
  {
    week: '11',
    games: [
      'Ind', 'Hou',
      'Ari', 'Kc',
      'Tb', 'Det',
      'Jax', 'Nyg',
      'Mia', 'Buf',
      'Ten', 'Dal',
      'Bal', 'Car',
      'No', 'Chi',
      'Nyj', 'Lac',
      'Pit', 'Phi',
      'Lv', 'Den',
      'Min', 'Sf',
      'Cin', 'Was'
    ]
  },
  {
    week: '12',
    games: [
      'Gb', 'Lar',
      'Chi', 'Det',
      'Phi', 'Dal',
      'Kc', 'Buf',
      'Den', 'Pit',
      'Bal', 'Hou',
      'No', 'Cin',
      'Nyj', 'Mia',
      'Atl', 'Min',
      'Nyg', 'Ind',
      'Lv', 'Cle',
      'Ten', 'Jax',
      'Was', 'Ari',
      'Sea', 'Sf',
      'Ne', 'Lac',
      'Car', 'Tb'
    ]
  },
  {
    week: '13',
    games: [
      'Kc', 'Lar',
      'Det', 'Atl',
      'Lac', 'Tb',
      'Was', 'Ten',
      'Cin', 'Cle',
      'Sf', 'Nyg',
      'Gb', 'No',
      'Jax', 'Chi',
      'Phi', 'Ari',
      'Mia', 'Den',
      'Car', 'Min',
      'Buf', 'Ne',
      'Hou', 'Pit',
      'Dal', 'Sea'
    ]
  },
  {
    week: '14',
    games: [
      'Min', 'Ne',
      'Den', 'Nyj',
      'Atl', 'Cle',
      'Chi', 'Mia',
      'Hou', 'Was',
      'No', 'Car',
      'Ind', 'Phi',
      'Tb', 'Bal',
      'Ten', 'Det',
      'Lac', 'Lv',
      'Kc', 'Cin',
      'Lar', 'Sf',
      'Nyg', 'Sea',
      'Buf', 'Gb',
      'Pit', 'Jax'
    ]
  },
  {
    week: '15',
    games: [
      'Sf', 'Lac',
      'Sea', 'Phi',
      'Chi', 'Buf',
      'Jax', 'Hou',
      'Bal', 'Pit',
      'Cle', 'Nyg',
      'Ind', 'Ten',
      'Mia', 'Gb',
      'No', 'Tb',
      'Cin', 'Car',
      'Atl', 'Was',
      'Nyj', 'Ari',
      'Dal', 'Lar',
      'Den', 'Lv',
      'Det', 'Min',
      'Ne', 'Kc'
    ]
  },
  {
    week: '16',
    games: [
      'Hou', 'Phi',
      'Gb', 'Chi',
      'Buf', 'Den',
      'Lar', 'Sea',
      'Tb', 'Atl',
      'Cin', 'Ind',
      'Was', 'Min',
      'Car', 'Pit',
      'Cle', 'Bal',
      'Lac', 'Mia',
      'Ari', 'No',
      'Ne', 'Nyj',
      'Ten', 'Lv',
      'Sf', 'Kc',
      'Jax', 'Dal',
      'Nyg', 'Det'
    ]
  },
  {
    week: '17',
    games: [
      'Bal', 'Cin',
      'Lar', 'Tb',
      'Den', 'Ne',
      'Kc', 'Lac',
      'Was', 'Jax',
      'Buf', 'Mia',
      'Pit', 'Ten',
      'Min', 'Nyj',
      'No', 'Atl',
      'Sea', 'Car',
      'Ind', 'Cle',
      'Nyg', 'Dal',
      'Lv', 'Ari',
      'Det', 'Chi',
      'Phi', 'Sf',
      'Hou', 'Gb'
    ]
  },
  {
    week: '18',
    games: [
      'Nyj', 'Buf',
      'Jax', 'Ind',
      'Lv', 'Kc',
      'Ten', 'Hou',
      'Lac', 'Den',
      'Mia', 'Ne',
      'Cle', 'Cin',
      'Pit', 'Bal',
      'Chi', 'Min',
      'Det', 'Gb',
      'Dal', 'Was',
      'Tb', 'No',
      'Phi', 'Nyg',
      'Sea', 'Lar',
      'Atl', 'Car',
      'Sf', 'Ari'
    ]
  }
];

async function loadSchedule() {
  try {
    await mongo();

    const operations = schedules.map(({ week, games }) => ({
      updateOne: {
        filter: { week },
        update: {
          $set: { games },
          $setOnInsert: { winners: '' }
        },
        upsert: true
      }
    }));

    await Schedule.bulkWrite(operations);

    console.log('2026 NFL schedule loaded successfully: Weeks 1-18.');
  } catch (error) {
    console.error('Schedule loader error:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

loadSchedule();
