const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
	{
		employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
		date: { type: Date, required: true },
		status: { type: String, enum: ['present', 'absent', 'late', 'half-day', 'remote', 'on-break'], default: 'present' },
		checkInAt: Date,
		checkOutAt: Date,
		breakStartAt: Date,
		breakEndAt: Date,
		breakDuration: { type: Number, default: 0 }, // in minutes
		workHours: { type: Number, default: 0 }, // calculated work hours
		workLocation: { type: String, enum: ['office', 'remote', 'hybrid'], default: 'office' },
		location: { type: String, default: '' }, // specific location notes
		latitude: { type: Number }, // GPS coordinates
		longitude: { type: Number },
		notes: { type: String, default: '' },
		overtime: { type: Number, default: 0 }, // overtime hours
		source: { type: String, enum: ['self', 'admin'], default: 'self' },
	},
	{ timestamps: true }
);

attendanceSchema.index({ employee: 1, date: -1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;

















