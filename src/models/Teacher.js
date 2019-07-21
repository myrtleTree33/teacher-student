import mongoose from 'mongoose';
import mongooseHidden from 'mongoose-hidden';

import logger from '../logger';

const { Schema } = mongoose;

const teacherSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  dateAdded: {
    type: Date,
    required: true,
    default: Date
  }
});

// This will add `id` in toJSON
teacherSchema.set('toJSON', {
  virtuals: true
});

// This will remove `_id` and `__v`
teacherSchema.plugin(mongooseHidden());

export default mongoose.model('Teacher', teacherSchema);
