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
		
		// NEW FIELDS FROM NEXUSFINAL2 ANALYSIS:
		firstName: { type: String, required: true },
		lastName: { type: String, required: true },
		phone: { type: String, trim: true },
		jobTitle: { type: String, trim: true },
		startDate: { type: Date, default: Date.now },
		gender: { type: String, enum: ['Male', 'Female', 'Other'], trim: true },
		maritalStatus: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed'], trim: true },
		avatar: { type: String, trim: true },
		
		// Enhanced Emergency Contact
		emergencyContact: {
			name: { type: String, trim: true },
			relationship: { type: String, trim: true },
			phone: { type: String, trim: true },
			address: { type: String, trim: true }
		},
		
		// Enhanced Bank Details
		bankDetails: {
			bankName: { type: String, trim: true },
			accountName: { type: String, trim: true },
			accountNumber: { type: String, trim: true },
			accountType: { type: String, trim: true },
			taxId: { type: String, trim: true },
			taxState: { type: String, trim: true },
			pensionNumber: { type: String, trim: true }
		},
		
		// Additional profile fields from nexusfinal2
		country: { type: String, trim: true, default: 'Nigeria' },
		employmentType: { 
			type: String, 
			enum: ['Permanent', 'Contract', 'Intern', 'Part-time'], 
			default: 'Permanent' 
		},
		
		// Legacy fields for backward compatibility
		emergencyContacts: [{ name: String, phone: String, relationship: String }],
		address: { street: String, city: String, state: String, zipCode: String, country: String },
		workSchedule: { type: String, enum: ['full-time', 'part-time', 'contract', 'shift'], default: 'full-time' },
		reportingManager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
		skills: [String],
		notes: String,
		
		// Document management
		documents: [{
			name: { type: String, required: true },
			category: { 
				type: String, 
				enum: ['personal', 'employment', 'training', 'performance', 'other'],
				required: true 
			},
			description: { type: String, default: '' },
			url: { type: String, required: true },
			uploadedAt: { type: Date, default: Date.now },
			uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
		}],
		
		// Employee settings and preferences
		settings: {
			notifications: {
				email: { type: Boolean, default: true },
				push: { type: Boolean, default: true },
				sms: { type: Boolean, default: false },
				leaveReminders: { type: Boolean, default: true },
				trainingReminders: { type: Boolean, default: true },
				performanceReviews: { type: Boolean, default: true },
				surveys: { type: Boolean, default: true }
			},
			privacy: {
				showProfile: { type: Boolean, default: true },
				showContactInfo: { type: Boolean, default: true },
				showDepartment: { type: Boolean, default: true }
			},
			preferences: {
				language: { type: String, default: 'en' },
				timezone: { type: String, default: 'UTC' },
				dateFormat: { type: String, default: 'MM/DD/YYYY' },
				theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' }
			}
		},
		
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

















