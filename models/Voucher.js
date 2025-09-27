import mongoose from 'mongoose';

const voucherSchema = new mongoose.Schema({
  association: {
    type: String,
    required: [true, 'Association is required'],
    trim: true,
    maxlength: [100, 'Association name cannot exceed 100 characters']
  },
  financialYear: {
    type: String,
    required: [true, 'Financial year is required'],
    trim: true,
    match: [/^\d{4}-\d{2,4}$/, 'Financial year must be in format YYYY-YY or YYYY-YYYY']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    validate: {
      validator: function(value) {
        return value <= new Date();
      },
      message: 'Date cannot be in the future'
    }
  },
  payee: {
    type: String,
    required: [true, 'Payee is required'],
    trim: true,
    maxlength: [200, 'Payee name cannot exceed 200 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0'],
    validate: {
      validator: function(value) {
        return Number.isFinite(value) && value > 0;
      },
      message: 'Amount must be a valid positive number'
    }
  },
  purpose: {
    type: String,
    required: [true, 'Purpose is required'],
    trim: true,
    maxlength: [500, 'Purpose cannot exceed 500 characters']
  },
  approvedBy: {
    type: String,
    required: [true, 'Approved by is required'],
    trim: true,
    maxlength: [100, 'Approved by name cannot exceed 100 characters']
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected'],
    default: 'draft'
  },
  voucherNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  createdBy: {
    type: String,
    default: 'system'
  },
  updatedBy: {
    type: String,
    default: 'system'
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for better query performance
voucherSchema.index({ association: 1, financialYear: 1 });
voucherSchema.index({ date: -1 });
voucherSchema.index({ payee: 1 });
voucherSchema.index({ amount: 1 });
voucherSchema.index({ status: 1 });
voucherSchema.index({ createdAt: -1 });

// Virtual for formatted amount
voucherSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(this.amount);
});

// Virtual for formatted date
voucherSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
});

// Pre-save middleware to generate voucher number
voucherSchema.pre('save', async function(next) {
  if (this.isNew && !this.voucherNumber) {
    const year = this.financialYear.split('-')[0];
    const count = await this.constructor.countDocuments({
      financialYear: this.financialYear
    });
    this.voucherNumber = `VCH-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Static method to get vouchers by financial year
voucherSchema.statics.getByFinancialYear = function(financialYear) {
  return this.find({ financialYear }).sort({ date: -1 });
};

// Static method to get vouchers by date range
voucherSchema.statics.getByDateRange = function(startDate, endDate) {
  return this.find({
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ date: -1 });
};

// Instance method to check if voucher can be edited
voucherSchema.methods.canEdit = function() {
  return this.status === 'draft' || this.status === 'pending';
};

// Instance method to check if voucher can be deleted
voucherSchema.methods.canDelete = function() {
  return this.status === 'draft' || this.status === 'rejected';
};

// Instance method to approve voucher
voucherSchema.methods.approve = async function(approvedBy) {
  if (this.status === 'draft' || this.status === 'pending') {
    this.status = 'approved';
    this.updatedBy = approvedBy;
    return await this.save();
  }
  throw new Error('Only draft or pending vouchers can be approved');
};

// Instance method to reject voucher
voucherSchema.methods.reject = async function(rejectedBy, reason) {
  if (this.status === 'draft' || this.status === 'pending') {
    this.status = 'rejected';
    this.notes = reason || this.notes;
    this.updatedBy = rejectedBy;
    return await this.save();
  }
  throw new Error('Only draft or pending vouchers can be rejected');
};

export default mongoose.model('Voucher', voucherSchema);
