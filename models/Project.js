const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['active', 'on_hold', 'completed', 'archived'], default: 'active' },
    startDate: { type: Date },
    endDate: { type: Date },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  },
  { timestamps: true }
);

projectSchema.index({ organizationId: 1, createdAt: -1 });

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;









