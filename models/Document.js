const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    fileUrl: { type: String, required: true },
    fileType: { type: String, default: '' },
    fileSizeBytes: { type: Number, default: 0 },
    tags: { type: [String], default: [] },
    visibility: { type: String, enum: ['all_staff', 'assigned_only'], default: 'assigned_only' },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  },
  { timestamps: true }
);

documentSchema.index({ status: 1, createdAt: -1 });

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;

















