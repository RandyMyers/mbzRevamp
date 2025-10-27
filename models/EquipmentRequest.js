const mongoose = require('mongoose');

const equipmentRequestSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    equipmentType: {
      type: String,
      required: true,
      enum: ['Laptop', 'Desktop', 'Monitor', 'Keyboard', 'Mouse', 'Headset', 'Phone', 'Tablet', 'Other']
    },
    equipmentName: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
    },
    requestDate: {
      type: Date,
      default: Date.now
    },
    expectedReturnDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Issued', 'Returned', 'Overdue'],
      default: 'Pending'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedDate: {
      type: Date
    },
    issuedDate: {
      type: Date
    },
    returnedDate: {
      type: Date
    },
    comments: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      comment: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    attachments: [{
      name: String,
      url: String,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  { timestamps: true }
);

equipmentRequestSchema.index({ employee: 1, status: 1 });
equipmentRequestSchema.index({ requestDate: -1 });

module.exports = mongoose.model('EquipmentRequest', equipmentRequestSchema);