const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Team = require('./models/Team');
const teams = require('./data/teams.json');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding');

  await Team.deleteMany({});
  const created = await Team.insertMany(teams);
  console.log(`Inserted ${created.length} teams`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
