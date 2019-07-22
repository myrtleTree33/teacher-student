import mongoose from 'mongoose';
import mongooseHidden from 'mongoose-hidden';

import logger from '../logger';

const { Schema } = mongoose;

const studentSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  dateSuspended: {
    type: Date,
    default: null
  },
  dateAdded: {
    type: Date,
    required: true,
    default: Date
  }
});

// This will add `id` in toJSON
studentSchema.set('toJSON', {
  virtuals: true
});

// This will remove `_id` and `__v`
studentSchema.plugin(mongooseHidden());

export default mongoose.model('Student', studentSchema);
