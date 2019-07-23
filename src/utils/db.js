import mongoose from 'mongoose';
import { Mockgoose } from 'mock-mongoose';

import logger from '../logger';

const initDb = () => {
  const mongoUri = process.env.MONGO_URI;

  // connect to Mongo DB
  if (mongoUri) {
    logger.info(`Connecting to ${mongoUri}..`);
    mongoose.connect(mongoUri);
    logger.info(`Connected to ${mongoUri}`);
  } else {
    const mockgoose = new Mockgoose(mongoose);
    mockgoose.prepareStorage().then(() => {
      mongoose.connect('mongodb://example.com/TestingDB', err => {
        err && logger.error(err);
      });
    });
  }
};

export default initDb;
