import mongoose from 'mongoose';

const savedViewSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    filters: {
      search: { type: String, default: '' },
      status: { type: String, enum: ['', 'todo', 'in-progress', 'done'], default: '' },
      assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      dueDateFrom: { type: String, default: '' },
      dueDateTo: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

savedViewSchema.index({ owner: 1, name: 1 }, { unique: true });

export default mongoose.model('SavedView', savedViewSchema);
