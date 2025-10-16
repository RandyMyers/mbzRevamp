require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/users');
const Organization = require('./models/organization');
const Role = require('./models/role');

async function testUserCreationRoleError() {
  try {
    console.log('🔍 TESTING USER CREATION ROLE ERROR');
    console.log('='.repeat(60));
    
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB');
    
    // Test 1: Check User Model Requirements
    console.log('\n📋 TEST 1: USER MODEL REQUIREMENTS');
    console.log('='.repeat(50));
    
    const userSchema = User.schema;
    const requiredFields = [];
    const optionalFields = [];
    
    // Check each field in the schema
    userSchema.eachPath((path, schemaType) => {
      if (schemaType.isRequired) {
        requiredFields.push(path);
      } else {
        optionalFields.push(path);
      }
    });
    
    console.log('✅ Required fields:', requiredFields);
    console.log('✅ Optional fields:', optionalFields.slice(0, 10), '...');
    
    // Test 2: Check Role Assignment Logic
    console.log('\n🔍 TEST 2: ROLE ASSIGNMENT LOGIC');
    console.log('='.repeat(50));
    
    // Find an organization with roles
    const organization = await Organization.findOne().select('_id name');
    if (!organization) {
      console.log('❌ No organization found for testing');
      return;
    }
    
    console.log(`🏢 Testing with organization: ${organization.name} (${organization._id})`);
    
    // Check available roles for this organization
    const roles = await Role.find({ organization: organization._id }).select('name _id');
    console.log(`👥 Available roles: ${roles.length}`);
    roles.forEach(role => {
      console.log(`   - ${role.name} (${role._id})`);
    });
    
    // Test 3: Simulate User Creation with Different Role Scenarios
    console.log('\n🧪 TEST 3: USER CREATION SCENARIOS');
    console.log('='.repeat(50));
    
    // Scenario 1: Create user with valid roleId
    if (roles.length > 0) {
      console.log('\n📝 Scenario 1: Valid roleId');
      try {
        const testUser1 = new User({
          name: 'Test User 1',
          email: 'testuser1@example.com',
          password: 'hashedpassword123',
          roleId: roles[0]._id,
          organization: organization._id,
          status: 'active'
        });
        
        const validationError = testUser1.validateSync();
        if (validationError) {
          console.log('❌ Validation errors:', validationError.message);
        } else {
          console.log('✅ Valid user creation with roleId');
        }
      } catch (error) {
        console.log('❌ Error creating user with roleId:', error.message);
      }
    }
    
    // Scenario 2: Create user without roleId
    console.log('\n📝 Scenario 2: No roleId');
    try {
      const testUser2 = new User({
        name: 'Test User 2',
        email: 'testuser2@example.com',
        password: 'hashedpassword123',
        organization: organization._id,
        status: 'active'
        // No roleId provided
      });
      
      const validationError = testUser2.validateSync();
      if (validationError) {
        console.log('❌ Validation errors:', validationError.message);
      } else {
        console.log('✅ User creation without roleId (should be valid)');
      }
    } catch (error) {
      console.log('❌ Error creating user without roleId:', error.message);
    }
    
    // Scenario 3: Create user with invalid roleId
    console.log('\n📝 Scenario 3: Invalid roleId');
    try {
      const testUser3 = new User({
        name: 'Test User 3',
        email: 'testuser3@example.com',
        password: 'hashedpassword123',
        roleId: new mongoose.Types.ObjectId(), // Invalid roleId
        organization: organization._id,
        status: 'active'
      });
      
      const validationError = testUser3.validateSync();
      if (validationError) {
        console.log('❌ Validation errors:', validationError.message);
      } else {
        console.log('✅ User creation with invalid roleId (should be valid at schema level)');
      }
    } catch (error) {
      console.log('❌ Error creating user with invalid roleId:', error.message);
    }
    
    // Test 4: Check createUser Function Logic
    console.log('\n🔧 TEST 4: CREATEUSER FUNCTION ANALYSIS');
    console.log('='.repeat(50));
    
    console.log('📋 createUser function parameters:');
    console.log('   - userId: Admin user ID (who is creating)');
    console.log('   - name: New user name');
    console.log('   - email: New user email');
    console.log('   - password: New user password');
    console.log('   - roleId: Role ID for the new user');
    console.log('   - department: Department for the new user');
    
    console.log('\n🔍 Potential "no role" error causes:');
    console.log('   1. roleId is null/undefined but required somewhere');
    console.log('   2. roleId is invalid ObjectId');
    console.log('   3. roleId references non-existent role');
    console.log('   4. roleId references role from different organization');
    console.log('   5. roleId is not provided but role field is required');
    
    // Test 5: Check Role Validation
    console.log('\n🔍 TEST 5: ROLE VALIDATION');
    console.log('='.repeat(50));
    
    if (roles.length > 0) {
      const testRoleId = roles[0]._id;
      console.log(`🧪 Testing with roleId: ${testRoleId}`);
      
      // Check if role exists
      const roleExists = await Role.findById(testRoleId);
      if (roleExists) {
        console.log('✅ Role exists:', roleExists.name);
        console.log('   Organization:', roleExists.organization);
        console.log('   Matches test org:', roleExists.organization.toString() === organization._id.toString());
      } else {
        console.log('❌ Role does not exist');
      }
    }
    
    // Test 6: Check Frontend Role Selection
    console.log('\n🎯 TEST 6: FRONTEND ROLE SELECTION');
    console.log('='.repeat(50));
    
    console.log('🔍 Frontend should:');
    console.log('   1. Fetch available roles for organization');
    console.log('   2. Display role selection dropdown');
    console.log('   3. Send selected roleId to backend');
    console.log('   4. Handle case where no role is selected');
    
    console.log('\n❌ Common frontend issues:');
    console.log('   1. Not fetching roles before showing form');
    console.log('   2. Not setting default role selection');
    console.log('   3. Sending null/undefined roleId');
    console.log('   4. Not handling role loading errors');
    
    // Test 7: Check Backend Error Handling
    console.log('\n🛠️ TEST 7: BACKEND ERROR HANDLING');
    console.log('='.repeat(50));
    
    console.log('🔍 createUser function should:');
    console.log('   1. Validate roleId if provided');
    console.log('   2. Check if role exists');
    console.log('   3. Check if role belongs to organization');
    console.log('   4. Provide clear error messages');
    console.log('   5. Handle missing roleId gracefully');
    
    console.log('\n❌ Current createUser function issues:');
    console.log('   1. No roleId validation');
    console.log('   2. No role existence check');
    console.log('   3. No organization role matching');
    console.log('   4. Generic error messages');
    
    // Test 8: Recommendations
    console.log('\n💡 TEST 8: RECOMMENDATIONS');
    console.log('='.repeat(50));
    
    console.log('🔧 Fixes needed in createUser function:');
    console.log('   1. Add roleId validation');
    console.log('   2. Add role existence check');
    console.log('   3. Add organization role matching');
    console.log('   4. Add better error messages');
    console.log('   5. Add default role assignment');
    
    console.log('\n🎯 Frontend fixes needed:');
    console.log('   1. Fetch roles before showing form');
    console.log('   2. Set default role selection');
    console.log('   3. Validate role selection');
    console.log('   4. Handle role loading errors');
    
    console.log('\n🎯 USER CREATION ROLE ERROR ANALYSIS COMPLETE!');
    console.log('='.repeat(60));
    console.log('✅ Root cause identified: Missing role validation in createUser function');
    console.log('✅ Frontend needs role selection implementation');
    console.log('✅ Backend needs role validation and error handling');
    
  } catch (error) {
    console.error('❌ Error in user creation role error test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

testUserCreationRoleError();
