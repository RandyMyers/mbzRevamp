const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  title: String,
  type: { type: String, enum: ['pdf', 'video', 'link', 'other'], default: 'other' },
  url: String,
  createdAt: { type: Date, default: Date.now }
});

const trainingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    materials: { type: [materialSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

trainingSchema.index({ status: 1, name: 1 });

const Training = mongoose.model('Training', trainingSchema);

module.exports = Training;

















