const mongoose = require('mongoose');
require('dotenv').config();

async function fixRoleIndex() {
  try {
    const mongoUri = process.env.MONGO_URL || process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/MBZCRM';
    console.log('Connecting to MongoDB...');
    // Hide password in logs
    console.log('URI:', mongoUri.replace(/:([^@]+)@/, ':****@'));
    await mongoose.connect(mongoUri);
    console.log('Connected to:', mongoose.connection.db.databaseName);

    const db = mongoose.connection.db;

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\nCollections in database:');
    collections.forEach(c => console.log('  -', c.name));

    const collection = db.collection('roles');

    // Check if collection exists
    const collectionExists = collections.some(c => c.name === 'roles');
    if (!collectionExists) {
      console.log('\n⚠️  roles collection does not exist yet. Creating it...');
      await db.createCollection('roles');
    }

    // List current indexes
    let indexes = [];
    try {
      indexes = await collection.indexes();
      console.log('\nCurrent indexes on roles collection:');
      indexes.forEach(idx => console.log('  -', idx.name, ':', JSON.stringify(idx.key)));
    } catch (e) {
      console.log('\nNo indexes found (collection may be new)');
    }

    // Check if name_1 index exists (the problematic one)
    const hasNameIndex = indexes.some(idx => idx.name === 'name_1');

    if (hasNameIndex) {
      console.log('\n⚠️  Found problematic index: name_1');
      console.log('Dropping name_1 index...');
      try {
        await collection.dropIndex('name_1');
        console.log('✅ Successfully dropped name_1 index');
      } catch (e) {
        console.log('Could not drop index:', e.message);
      }
    } else {
      console.log('\n✅ No name_1 index found (already correct)');
    }

    // Verify the compound index exists
    const hasCompoundIndex = indexes.some(idx => idx.name === 'name_1_organization_1');
    if (!hasCompoundIndex) {
      console.log('\nCreating compound index name_1_organization_1...');
      try {
        await collection.createIndex({ name: 1, organization: 1 }, { unique: true });
        console.log('✅ Created compound index');
      } catch (e) {
        console.log('Could not create index:', e.message);
      }
    } else {
      console.log('✅ Compound index name_1_organization_1 already exists');
    }

    // Show final indexes
    const finalIndexes = await collection.indexes();
    console.log('\nFinal indexes:');
    finalIndexes.forEach(idx => console.log('  -', idx.name, ':', JSON.stringify(idx.key)));

    await mongoose.disconnect();
    console.log('\n✅ Done! You can now create roles with the same name in different organizations.');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixRoleIndex();
