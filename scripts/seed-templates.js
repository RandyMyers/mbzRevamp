/**
 * Template Seeding Script
 *
 * This script seeds the database with 7 WordPress theme templates
 * that users can choose from when creating their website.
 *
 * Usage: node scripts/seed-templates.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Template = require('../models/template');
const User = require('../models/users');

const templates = [
  {
    name: 'Idyllic Fashion',
    description: 'A beautiful and elegant WordPress theme perfect for fashion boutiques, clothing stores, and apparel brands. Features a modern design with stunning product galleries and customizable layouts.',
    image: {
      url: 'https://themefreesia.com/wp-content/uploads/2017/03/idyllic-demo-screenshot-2.jpg',
      publicId: null
    },
    previewUrl: 'https://demo.themefreesia.com/idyllic-fashion/',
    category: 'ecommerce',
    isPremium: false,
    price: 0,
    features: [
      'Responsive Design',
      'Product Gallery',
      'WooCommerce Compatible',
      'Fashion-focused Layout',
      'Customizable Colors',
      'Mobile Optimized'
    ],
    businessType: 'Fashion & Apparel'
  },
  {
    name: 'Supermarket',
    description: 'A comprehensive ecommerce theme designed for supermarkets, grocery stores, and food retailers. Includes multiple product categories, advanced search, and shopping cart functionality.',
    image: {
      url: 'https://demo.themefreesia.com/wp-content/uploads/2020/09/screenshot.png',
      publicId: null
    },
    previewUrl: 'https://demo.themefreesia.com/supermarket/',
    category: 'ecommerce',
    isPremium: false,
    price: 0,
    features: [
      'Multi-category Support',
      'Advanced Product Filters',
      'WooCommerce Integration',
      'Shopping Cart',
      'Product Quick View',
      'Responsive Layout'
    ],
    businessType: 'Food & Beverages'
  },
  {
    name: 'UrbanCart Gadget Store',
    description: 'Modern and sleek WordPress theme tailored for electronics stores, gadget shops, and tech retailers. Features a clean design that showcases products beautifully with detailed specifications.',
    image: {
      url: 'https://www.wpradiant.net/cdn/shop/files/ecommerce-store-wordpress-theme.png?v=1740994706',
      publicId: null
    },
    previewUrl: 'https://preview.wpradiant.net/ecommerce-gadget-store/',
    category: 'ecommerce',
    isPremium: false,
    price: 0,
    features: [
      'Product Specifications Display',
      'Tech-focused Design',
      'WooCommerce Ready',
      'Product Comparison',
      'Review System',
      'Mobile Responsive'
    ],
    businessType: 'Electronics & Gadgets'
  },
  {
    name: 'Botiga',
    description: 'A versatile and highly customizable WordPress theme suitable for any type of online store. Features a modern, minimalist design with powerful customization options and excellent performance.',
    image: {
      url: 'https://athemes.com/wp-content/uploads/hero-1-2048x1485.jpg',
      publicId: null
    },
    previewUrl: 'https://demo.athemes.com/themes/?theme=Botiga',
    category: 'ecommerce',
    isPremium: false,
    price: 0,
    features: [
      'Highly Customizable',
      'Fast Loading Speed',
      'WooCommerce Optimized',
      'Multiple Layouts',
      'SEO Friendly',
      'Gutenberg Compatible'
    ],
    businessType: 'Other'
  },
  {
    name: 'Super Mart',
    description: 'A robust ecommerce theme built for large-scale stores, supermarkets, and multi-vendor marketplaces. Includes advanced inventory management integration and comprehensive product categorization.',
    image: {
      url: 'https://www.misbahwp.com/cdn/shop/files/super-mart-wordpress-theme.png?v=1755944111&width=940',
      publicId: null
    },
    previewUrl: 'https://demo.misbahwp.com/super-mart-store/',
    category: 'ecommerce',
    isPremium: false,
    price: 0,
    features: [
      'Large Catalog Support',
      'Advanced Categorization',
      'WooCommerce Compatible',
      'Multi-vendor Ready',
      'Inventory Integration',
      'Promotional Banners'
    ],
    businessType: 'Food & Beverages'
  },
  {
    name: 'Modern Fashion Store Pro',
    description: 'Modern WordPress theme designed specifically for high-end fashion brands and luxury apparel stores. Features elegant typography, stunning product presentations, and a sophisticated shopping experience.',
    image: {
      url: 'https://www.themespride.com/cdn/shop/files/fashion-wordpress-theme.png?v=1755599852&width=1206',
      publicId: null
    },
    previewUrl: 'https://page.themespride.com/modern-fashion-store/?_gl=1%2Avb3de3%2A_gcl_au%2AMTU4Mjc1MjA3OC4xNzU5NTEyNjE4',
    category: 'ecommerce',
    isPremium: false,
    price: 0,
    features: [
      'Luxury Design',
      'Lookbook Galleries',
      'Size Guide Integration',
      'Wishlist Functionality',
      'Instagram Feed',
      'Newsletter Integration'
    ],
    businessType: 'Fashion & Apparel'
  },
  {
    name: 'Mattress Shop Pro',
    description: 'Specialized WordPress theme for furniture stores, mattress shops, and home decor retailers. Features product comparison tools, detailed specifications display, and bedroom visualization.',
    image: {
      url: 'https://www.buywptemplates.com/cdn/shop/files/mattress-wordpress-theme.png?v=1756458679&width=1346',
      publicId: null
    },
    previewUrl: 'https://demos.buywptemplates.com/mattress-shop-pro/',
    category: 'ecommerce',
    isPremium: false,
    price: 0,
    features: [
      'Product Comparison',
      'Specification Display',
      'Room Visualization',
      'Delivery Information',
      'WooCommerce Integration',
      'Customer Reviews'
    ],
    businessType: 'Home & Furniture'
  }
];

async function seedTemplates() {
  try {
    console.log('🌱 Starting template seeding process...\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    console.log('   Using connection string:', process.env.MONGO_URL.replace(/\/\/.*:.*@/, '//***:***@'));
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
    console.log('   Database name:', mongoose.connection.db.databaseName);
    console.log('   Collection will be:', Template.collection.name);
    console.log('');

    // Find a super admin user to assign as template creator
    console.log('👤 Finding super admin user...');
    let adminUser = await User.findOne({ role: 'super-admin' });

    if (!adminUser) {
      console.log('⚠️  No super admin found, using first user...');
      adminUser = await User.findOne();

      if (!adminUser) {
        console.error('❌ No users found in database. Please create a user first.');
        process.exit(1);
      }
    }

    console.log(`✅ Using user: ${adminUser.email} (${adminUser._id})\n`);

    // Check if templates already exist
    const existingCount = await Template.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing templates in database.`);
      console.log('❓ Do you want to:');
      console.log('   1. Clear existing and add new templates');
      console.log('   2. Skip seeding (keep existing templates)');
      console.log('   3. Add new templates alongside existing ones\n');
      console.log('💡 For now, we will SKIP to preserve existing data.\n');
      console.log('   To force re-seed, run: node scripts/seed-templates.js --force\n');

      // Check if --force flag is provided
      const forceFlag = process.argv.includes('--force');
      if (!forceFlag) {
        console.log('✅ Seeding skipped. Existing templates preserved.');
        process.exit(0);
      }

      console.log('🗑️  Clearing existing templates...');
      await Template.deleteMany({});
      console.log('✅ Existing templates cleared\n');
    }

    // Insert templates
    console.log('📝 Inserting templates into database...\n');

    const templatesWithUserId = templates.map(template => ({
      ...template,
      userId: adminUser._id
    }));

    const insertedTemplates = await Template.insertMany(templatesWithUserId);

    console.log('✅ Successfully inserted templates:\n');
    insertedTemplates.forEach((template, index) => {
      console.log(`   ${index + 1}. ${template.name}`);
      console.log(`      Category: ${template.category}`);
      console.log(`      Business Type: ${template.businessType}`);
      console.log(`      ID: ${template._id}`);
      console.log('');
    });

    // Summary
    console.log('📊 Summary:');
    console.log(`   Total templates seeded: ${insertedTemplates.length}`);
    console.log(`   All templates are FREE`);
    console.log('');

    // Verify
    const totalInDb = await Template.countDocuments();
    console.log(`✅ Verification: ${totalInDb} templates now in database`);
    console.log('');
    console.log('🎉 Template seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  }
}

// Run the seeding
seedTemplates();
