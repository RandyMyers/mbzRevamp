const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: [true, 'Category slug is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Category description cannot exceed 500 characters']
  },
  image: {
    src: {
      type: String,
      trim: true
    },
    alt: {
      type: String,
      trim: true
    }
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  wooCommerceId: {
    type: Number,
    default: null
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: [true, 'Store ID is required']
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  menuOrder: {
    type: Number,
    default: 0
  },
  productCount: {
    type: Number,
    default: 0
  },
  syncStatus: {
    type: String,
    enum: ['synced', 'pending', 'failed'],
    default: 'pending'
  },
  lastSyncedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
categorySchema.index({ storeId: 1, isActive: 1 });
categorySchema.index({ organizationId: 1, isActive: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ wooCommerceId: 1 });
categorySchema.index({ parent: 1 });

// Pre-save middleware to generate slug if not provided
categorySchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Virtual for full category path (breadcrumb)
categorySchema.virtual('fullPath').get(function() {
  if (!this.parent) {
    return this.name;
  }
  // This would need to be populated to work properly
  return this.name;
});

// Method to update product count
categorySchema.methods.updateProductCount = async function() {
  const Product = mongoose.model('Inventory');
  const count = await Product.countDocuments({ 
    categories: { $in: [this._id] },
    isActive: true 
  });
  this.productCount = count;
  return this.save();
};

// Static method to get categories by store
categorySchema.statics.getByStore = function(storeId, options = {}) {
  const query = { storeId, isActive: true };
  
  if (options.parent) {
    query.parent = options.parent;
  }
  
  return this.find(query)
    .sort({ menuOrder: 1, name: 1 })
    .populate('parent', 'name slug')
    .lean();
};

// Static method to get category tree
categorySchema.statics.getCategoryTree = function(storeId) {
  return this.find({ storeId, isActive: true })
    .sort({ menuOrder: 1, name: 1 })
    .populate('parent', 'name slug')
    .lean()
    .then(categories => {
      const categoryMap = {};
      const roots = [];
      
      // Create a map of all categories
      categories.forEach(category => {
        categoryMap[category._id.toString()] = {
          ...category,
          children: []
        };
      });
      
      // Build the tree structure
      categories.forEach(category => {
        if (category.parent) {
          const parentId = category.parent._id.toString();
          if (categoryMap[parentId]) {
            categoryMap[parentId].children.push(categoryMap[category._id.toString()]);
          }
        } else {
          roots.push(categoryMap[category._id.toString()]);
        }
      });
      
      return roots;
    });
};

module.exports = mongoose.model('Category', categorySchema); 