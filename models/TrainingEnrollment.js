const mongoose = require('mongoose');

const trainingEnrollmentSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    training: { type: mongoose.Schema.Types.ObjectId, ref: 'Training', required: true },
    status: { type: String, enum: ['enrolled', 'completed'], default: 'enrolled' },
    certificateUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

trainingEnrollmentSchema.index({ employee: 1, training: 1 }, { unique: true });

const TrainingEnrollment = mongoose.model('TrainingEnrollment', trainingEnrollmentSchema);

module.exports = TrainingEnrollment;









