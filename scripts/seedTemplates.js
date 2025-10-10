const mongoose = require('mongoose');
require('dotenv').config();

// Import the Template model
const Template = require('../models/template');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Template data to seed
const templatesData = [
  {
    name: 'GreenVista',
    description: 'Clean design perfect for fashion and home furniture stores. Features a green color scheme and excellent product showcase capabilities.',
    category: 'ecommerce',
    previewUrl: 'https://gracethemesdemo.com/greenvista/',
    features: [
      'Clean design',
      'Green color scheme',
      'Product showcase',
      'Responsive layout',
      'Fashion & Home friendly'
    ],
    price: 0
  },
  {
    name: 'Glamazon',
    description: 'Elegant layout designed for beauty and fashion businesses. Features stunning image galleries and premium aesthetics.',
    category: 'ecommerce',
    previewUrl: 'https://gracethemesdemo.com/glamazon/',
    features: [
      'Elegant layout',
      'Beauty/Fashion focused',
      'Image galleries',
      'Premium aesthetics',
      'Modern design'
    ],
    price: 0
  },
  {
    name: 'Groceem',
    description: 'Perfect for grocery stores and food businesses. Features category navigation and fresh product displays.',
    category: 'ecommerce',
    previewUrl: 'https://www.gracethemesdemo.com/groceem/',
    features: [
      'Grocery store layout',
      'Category navigation',
      'Fresh product display',
      'Shopping cart optimization',
      'Food & Beverage focused'
    ],
    price: 0
  },
  {
    name: 'RichStore',
    description: 'Modern design with premium feel, ideal for multi-product categories. Perfect for fashion and electronics stores.',
    category: 'ecommerce',
    previewUrl: 'https://www.gracethemesdemo.com/richstore/',
    features: [
      'Modern design',
      'Multi-product categories',
      'Premium feel',
      'Advanced filtering',
      'Professional layout'
    ],
    price: 29
  },
  {
    name: 'GoldStar',
    description: 'Luxury branding template with gold accents. Designed for premium product showcase and high-end retail.',
    category: 'ecommerce',
    previewUrl: 'https://gracethemesdemo.com/goldstar/',
    features: [
      'Luxury branding',
      'Gold accents',
      'Premium product showcase',
      'Elegant typography',
      'High-end retail focus'
    ],
    price: 39
  },
  {
    name: 'Idyllic Fashion',
    description: 'Fashion-focused template with elegant typography and lookbook-style presentation.',
    category: 'ecommerce',
    previewUrl: 'https://demo.themefreesia.com/idyllic-fashion/',
    features: [
      'Fashion-focused',
      'Elegant typography',
      'Lookbook style',
      'Trendy design',
      'Image-centric layout'
    ],
    price: 0
  },
  {
    name: 'Supermarket',
    description: 'Complete supermarket layout with bulk products support and dedicated sale sections.',
    category: 'ecommerce',
    previewUrl: 'https://demo.themefreesia.com/supermarket/',
    features: [
      'Supermarket layout',
      'Bulk products',
      'Sale sections',
      'Department organization',
      'Deal highlights'
    ],
    price: 0
  },
  {
    name: 'Gadget Store',
    description: 'Tech-focused template perfect for electronics and gadgets. Features product specifications and modern UI.',
    category: 'ecommerce',
    previewUrl: 'https://preview.wpradiant.net/ecommerce-gadget-store/',
    features: [
      'Tech-focused',
      'Product specifications',
      'Modern UI',
      'Electronics optimized',
      'Feature comparison'
    ],
    price: 0
  },
  {
    name: 'Botiga',
    description: 'Versatile business template suitable for various services. Highly customizable and business-friendly.',
    category: 'business',
    previewUrl: 'https://demo.athemes.com/themes/?theme=Botiga',
    features: [
      'Versatile design',
      'Business-friendly',
      'Customizable',
      'Service-oriented',
      'Professional appearance'
    ],
    price: 49
  },
  {
    name: 'Super Mart Store',
    description: 'Mega store layout with department sections and deals highlights. Perfect for large retail operations.',
    category: 'ecommerce',
    previewUrl: 'https://demo.misbahwp.com/super-mart-store/',
    features: [
      'Mega store layout',
      'Department sections',
      'Deals highlights',
      'Multi-category support',
      'Large inventory friendly'
    ],
    price: 0
  },
  {
    name: 'Modern Fashion Store',
    description: 'Contemporary design showcasing fashion trends. Features Instagram integration for social commerce.',
    category: 'ecommerce',
    previewUrl: 'https://page.themespride.com/modern-fashion-store/',
    features: [
      'Contemporary design',
      'Fashion trends',
      'Instagram integration',
      'Social commerce',
      'Trendsetter layout'
    ],
    price: 35
  },
  {
    name: 'Mattress Shop Pro',
    description: 'Specialized template for home furniture and mattress stores. Features product comparison and comfort highlights.',
    category: 'ecommerce',
    previewUrl: 'https://demos.buywptemplates.com/mattress-shop-pro/',
    features: [
      'Product comparison',
      'Comfort features',
      'Sleep solutions',
      'Furniture optimized',
      'Detailed specifications'
    ],
    price: 45
  }
];

// Seed function
const seedTemplates = async () => {
  try {
    console.log('🌱 Starting template seeding...\n');

    // Check if templates already exist
    const existingTemplates = await Template.countDocuments();
    
    if (existingTemplates > 0) {
      console.log(`⚠️  Found ${existingTemplates} existing template(s) in the database.`);
      console.log('Do you want to clear existing templates? (This script will exit - modify if needed)\n');
      process.exit(0);
    }

    // Get or create a system user ID for templates
    // For now, we'll use a placeholder ObjectId - you can update this later
    const systemUserId = new mongoose.Types.ObjectId('000000000000000000000001');
    
    console.log('📝 Preparing to insert 12 templates...\n');

    // Add userId to each template
    const templatesWithUserId = templatesData.map(template => ({
      ...template,
      userId: systemUserId
    }));

    // Insert all templates
    const insertedTemplates = await Template.insertMany(templatesWithUserId);

    console.log(`✅ Successfully seeded ${insertedTemplates.length} templates!\n`);
    
    // Display summary
    console.log('📊 Template Summary:');
    console.log('━'.repeat(60));
    
    const summary = {
      total: insertedTemplates.length,
      ecommerce: insertedTemplates.filter(t => t.category === 'ecommerce').length,
      business: insertedTemplates.filter(t => t.category === 'business').length,
      free: insertedTemplates.filter(t => t.price === 0).length,
      paid: insertedTemplates.filter(t => t.price > 0).length,
    };

    console.log(`Total Templates:     ${summary.total}`);
    console.log(`E-commerce:          ${summary.ecommerce}`);
    console.log(`Business:            ${summary.business}`);
    console.log(`Free Templates:      ${summary.free}`);
    console.log(`Paid Templates:      ${summary.paid}`);
    console.log('━'.repeat(60));
    
    console.log('\n📋 Inserted Templates:');
    insertedTemplates.forEach((template, index) => {
      const priceTag = template.price === 0 ? 'FREE' : `$${template.price}`;
      console.log(`${index + 1}. ${template.name.padEnd(25)} [${template.category}] - ${priceTag}`);
    });

    console.log('\n✨ Seeding completed successfully!');
    console.log('💡 Note: Template images can be updated later through super admin features.\n');

  } catch (error) {
    console.error('❌ Error seeding templates:', error.message);
    console.error(error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
    process.exit(0);
  }
};

// Run the seed script
const run = async () => {
  await connectDB();
  await seedTemplates();
};

run();

