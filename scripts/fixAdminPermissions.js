const mongoose = require('mongoose');
require('dotenv').config();

const { generateAdminPermissions } = require('../config/permissions');

async function fixAdminPermissions() {
  try {
    const mongoUri = process.env.MONGO_URL || process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/MBZCRM';
    console.log('Connecting to MongoDB...');
    console.log('URI:', mongoUri.replace(/:([^@]+)@/, ':****@'));

    await mongoose.connect(mongoUri);
    console.log('Connected to:', mongoose.connection.db.databaseName);

    const db = mongoose.connection.db;
    const rolesCollection = db.collection('roles');

    // Generate full admin permissions
    const fullAdminPermissions = generateAdminPermissions();
    console.log('\n📋 Full Admin Permissions Structure:');
    console.log(JSON.stringify(fullAdminPermissions, null, 2));

    // Find all admin/administrator roles (case-insensitive)
    const adminRoles = await rolesCollection.find({
      $or: [
        { name: { $regex: /^admin$/i } },
        { name: { $regex: /^administrator$/i } },
        { isSystemRole: true }
      ]
    }).toArray();

    console.log(`\n🔍 Found ${adminRoles.length} admin role(s):`);
    adminRoles.forEach(role => {
      console.log(`  - ${role.name} (ID: ${role._id}, Org: ${role.organization})`);
    });

    if (adminRoles.length === 0) {
      console.log('\n⚠️  No admin roles found to update');
      await mongoose.disconnect();
      return;
    }

    // Update each admin role with full permissions
    let updated = 0;
    for (const role of adminRoles) {
      console.log(`\n🔄 Updating role: ${role.name} (${role._id})`);

      // Show current permissions
      console.log('  Current permissions modules:', Object.keys(role.permissions || {}));

      const result = await rolesCollection.updateOne(
        { _id: role._id },
        {
          $set: {
            permissions: fullAdminPermissions,
            updatedAt: new Date()
          }
        }
      );

      if (result.modifiedCount > 0) {
        console.log('  ✅ Updated successfully');
        updated++;
      } else {
        console.log('  ⚠️  No changes made (may already have correct permissions)');
      }
    }

    console.log(`\n✅ Updated ${updated}/${adminRoles.length} admin roles with full permissions`);

    // Verify the update
    console.log('\n📊 Verifying updates...');
    const verifiedRoles = await rolesCollection.find({
      _id: { $in: adminRoles.map(r => r._id) }
    }).toArray();

    for (const role of verifiedRoles) {
      const permModules = Object.keys(role.permissions || {});
      const expectedModules = Object.keys(fullAdminPermissions);
      const hasAllModules = expectedModules.every(m => permModules.includes(m));

      console.log(`  ${role.name}: ${hasAllModules ? '✅' : '❌'} ${permModules.length}/${expectedModules.length} modules`);

      if (!hasAllModules) {
        const missing = expectedModules.filter(m => !permModules.includes(m));
        console.log(`    Missing: ${missing.join(', ')}`);
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Done! Admin roles now have all available permissions.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixAdminPermissions();
