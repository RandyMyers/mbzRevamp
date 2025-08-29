const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
	{
		employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
		date: { type: Date, required: true },
		status: { type: String, enum: ['present', 'absent', 'remote'], default: 'present' },
		checkInAt: Date,
		breakStartAt: Date,
		breakEndAt: Date,
		checkOutAt: Date,
		notes: { type: String, default: '' },
		source: { type: String, enum: ['self', 'admin'], default: 'self' },
	},
	{ timestamps: true }
);

attendanceSchema.index({ employee: 1, date: -1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;

















