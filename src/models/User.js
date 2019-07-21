import mongoose from 'mongoose';
import mongooseHidden from 'mongoose-hidden';

import logger from '../logger';

const { Schema } = mongoose;

const userSchema = new Schema({});

// This will add `id` in toJSON
userSchema.set('toJSON', {
  virtuals: true
});

// This will remove `_id` and `__v`
userSchema.plugin(mongooseHidden());

export default mongoose.model('User', userSchema);
