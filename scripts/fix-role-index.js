/**
 * Fix Role Index - Drop old unique index on 'name' field
 * 
 * This script removes the old unique index on the 'name' field
 * that's causing E11000 duplicate key errors during registration.
 * 
 * The correct index is a compound index on (name + organization)
 * which allows each organization to have its own 'admin' role.
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function fixRoleIndex() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('roles');

    console.log('\n📋 Current indexes on roles collection:');
    const indexes = await collection.indexes();
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}:`, JSON.stringify(index.key));
    });

    // Check if the problematic index exists
    const hasOldIndex = indexes.some(idx => 
      idx.name === 'name_1' && Object.keys(idx.key).length === 1
    );

    if (hasOldIndex) {
      console.log('\n⚠️  Found old unique index on "name" field');
      console.log('🗑️  Dropping index: name_1');
      
      await collection.dropIndex('name_1');
      console.log('✅ Successfully dropped old index');
    } else {
      console.log('\n✅ No problematic index found');
    }

    console.log('\n📋 Updated indexes:');
    const newIndexes = await collection.indexes();
    newIndexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}:`, JSON.stringify(index.key));
    });

    // Verify the compound index exists
    const hasCompoundIndex = newIndexes.some(idx => 
      idx.name.includes('name') && idx.name.includes('organization')
    );

    if (hasCompoundIndex) {
      console.log('\n✅ Compound index (name + organization) exists - registrations should work now!');
    } else {
      console.log('\n⚠️  Warning: Compound index not found. Creating it...');
      await collection.createIndex(
        { name: 1, organization: 1 },
        { unique: true, name: 'name_1_organization_1' }
      );
      console.log('✅ Compound index created');
    }

    console.log('\n🎉 Index fix complete!');
    console.log('📝 You can now register users with the same role names in different organizations.');
    
  } catch (error) {
    console.error('❌ Error fixing role index:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
fixRoleIndex();

