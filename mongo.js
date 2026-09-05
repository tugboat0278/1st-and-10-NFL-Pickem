const mongoose = require('mongoose');

module.exports = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI environment variable is not set.');
  }

  await mongoose.connect(mongoUri);

  return mongoose;
};
