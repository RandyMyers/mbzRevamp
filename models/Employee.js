const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		fullName: { type: String, required: true },
		email: { type: String, required: true },
		department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
		roleTitle: { type: String, default: '' },
		status: { type: String, enum: ['active', 'suspended', 'terminated'], default: 'active' },
		salary: { type: Number, default: 0 },
		// Auto-generated employee ID (e.g., Mb001Z, Mb002Z, etc.)
		employeeId: {
			type: String,
			unique: true,
			sparse: true, // Allows null values but ensures uniqueness when present
			description: 'Auto-generated employee ID for staff (e.g., Mb001Z, Mb002Z)'
		},
		// Tax state/province for employees (any country)
		taxState: {
			type: String,
			trim: true,
			description: 'Tax state/province for staff members (any country)'
		},
		bankDetails: {
			bankName: String,
			accountNumber: String,
			accountName: String,
		},
		emergencyContacts: [{ name: String, phone: String, relationship: String }],
		metadata: { type: Object, default: {} },
	},
	{ timestamps: true }
);

employeeSchema.index({ status: 1, email: 1 });

// Static method to generate the next employee ID
employeeSchema.statics.generateEmployeeId = async function() {
  try {
    // Find the highest existing employee ID
    const lastEmployee = await this.findOne(
      { employeeId: { $regex: /^Mb\d+Z$/ } },
      { employeeId: 1 },
      { sort: { employeeId: -1 } }
    );

    let nextNumber = 1;
    if (lastEmployee && lastEmployee.employeeId) {
      // Extract the number from the last employee ID (e.g., "Mb001Z" -> 1)
      const match = lastEmployee.employeeId.match(/Mb(\d+)Z/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    // Format the number with leading zeros (e.g., 1 -> "001")
    const formattedNumber = nextNumber.toString().padStart(3, '0');
    return `Mb${formattedNumber}Z`;
  } catch (error) {
    console.error('Error generating employee ID:', error);
    throw new Error('Failed to generate employee ID');
  }
};

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;

















