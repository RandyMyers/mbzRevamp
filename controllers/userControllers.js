const User = require('../models/users');
const Organization = require('../models/organization');
const bcrypt = require('bcryptjs');
const cloudinary = require('cloudinary').v2;
const Role = require('../models/role');
const Group = require('../models/group');
const Invitation = require('../models/invitation');
const AuditLog = require('../models/auditLog');
const logEvent = require('../helper/logEvent');

// Create a new user
//Create User



// Create a new user within the same organization as the admin

exports.createUser = async (req, res) => {
  const { userId, name, email, password, role, department } = req.body;

  try {
    const admin = await User.findById(userId);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const organization = await Organization.findById(admin.organization);
    if (!organization) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let profilePictureUrl = null;

    if (req.files && req.files.profilePicture) {
      const result = await cloudinary.uploader.upload(req.files.profilePicture.tempFilePath, {
        folder: "profile_pictures",
      });
      profilePictureUrl = result.secure_url;
    }

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'employee',
      department,
      organization: organization._id,
      profilePicture: profilePictureUrl,
    });

    await newUser.save();

    await logEvent({
      action: 'create_user',
      user: admin._id,
      resource: 'User',
      resourceId: newUser._id,
      details: { email },
      organization: organization._id
    });

    res.status(201).json({ success: true, message: "User created", user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// Get all users in an organization
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().populate("organization");
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get a single user by ID
exports.getUserById = async (req, res) => {
  const { userId } = req.params;
  
  try {
    const user = await User.findById(userId).populate("organization");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update user details (e.g., name, email, role)
exports.updateUser = async (req, res) => {
  const { userId } = req.params;
  const { name, username, email, department, role, status, profilePicture } = req.body;
  console.log(req.body);

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update user fields
    user.name = name || user.name;
    user.username = username || user.username;
    user.department = department || user.department;
    user.email = email || user.email;
    user.role = role || user.role;
    user.status = status || user.status;
    user.profilePicture = profilePicture || user.profilePicture;

    // Save updated user
    await user.save();

    await logEvent({
      action: 'update_user',
      user: user._id,
      resource: 'User',
      resourceId: user._id,
      details: { name, username, email, department, role, status, profilePicture },
      organization: user.organization
    });

    res.status(200).json({ success: true, message: "User updated successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update user status (active/inactive)
exports.updateUserStatus = async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;

  console.log(req.params);

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.status = status;  // 'active' or 'inactive'
    await user.save();

    await logEvent({
      action: 'update_user_status',
      user: user._id,
      resource: 'User',
      resourceId: user._id,
      details: { status },
      organization: user.organization
    });

    res.status(200).json({ success: true, message: "User status updated successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get users by organization
exports.getUsersByOrganization = async (req, res) => {
  const { organizationId } = req.params;

  try {
    // Fetch all users belonging to the specified organization
    const users = await User.find({ organization: organizationId }).populate("organization");

    console.log('users for the organization', users);
    if (!users.length) {
      return res.status(404).json({ success: false, message: "No users found for this organization." });
    }

    // Count users by role
    const roleCounts = users.reduce((counts, user) => {
      const role = user.role; // Assuming `role` is the field in the User schema
      counts[role] = counts[role] ? counts[role] + 1 : 1;
      return counts;
    }, {});

    console.log(roleCounts);

    res.status(200).json({ success: true, users, roleCounts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// Delete a user
exports.deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Delete the user
    await user.remove();

    await logEvent({
      action: 'delete_user',
      user: user._id,
      resource: 'User',
      resourceId: user._id,
      details: { organization: user.organization },
      organization: user.organization
    });

    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update profile picture
exports.updateProfilePicture = async (req, res) => {
  const { userId } = req.params;

  try {
    // Ensure a file was uploaded
    if (!req.files || !req.files.profilePicture) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const file = req.files.profilePicture;
    console.log(file);

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "profile_pictures",
    });

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update the user's profile picture URL
    user.profilePicture = result.secure_url;
    await user.save();

    console.log(user.profilePicture);

    await logEvent({
      action: 'update_profile_picture',
      user: user._id,
      resource: 'User',
      resourceId: user._id,
      details: { profilePicture: user.profilePicture },
      organization: user.organization
    });

    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get user regional settings
exports.getUserRegionalSettings = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('language timezone dateFormat timeFormat')
      .populate('organization', 'name defaultCurrency');

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ 
      success: true, 
      data: {
        language: user.language || 'en',
        timezone: user.timezone || 'UTC',
        dateFormat: user.dateFormat || 'MM/DD/YYYY',
        timeFormat: user.timeFormat || '12',
        organization: user.organization
      }
    });
  } catch (error) {
    console.error('Get User Regional Settings Error:', error);
    res.status(500).json({ success: false, message: "Failed to get regional settings" });
  }
};

// Update user regional settings
exports.updateUserRegionalSettings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { language, timezone, dateFormat, timeFormat } = req.body;

    // Validate inputs
    const validLanguages = ['en', 'es', 'fr'];
    const validTimezones = ['UTC', 'EST', 'PST', 'GMT', 'CET'];
    const validDateFormats = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];
    const validTimeFormats = ['12', '24'];

    if (language && !validLanguages.includes(language)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid language. Must be one of: en, es, fr" 
      });
    }

    if (timezone && !validTimezones.includes(timezone)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid timezone. Must be one of: UTC, EST, PST, GMT, CET" 
      });
    }

    if (dateFormat && !validDateFormats.includes(dateFormat)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid date format. Must be one of: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD" 
      });
    }

    if (timeFormat && !validTimeFormats.includes(timeFormat)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid time format. Must be 12 or 24" 
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        language, 
        timezone, 
        dateFormat, 
        timeFormat,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    ).select('language timezone dateFormat timeFormat');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ 
      success: true, 
      message: "Regional settings updated successfully",
      data: {
        language: updatedUser.language,
        timezone: updatedUser.timezone,
        dateFormat: updatedUser.dateFormat,
        timeFormat: updatedUser.timeFormat
      }
    });
  } catch (error) {
    console.error('Update User Regional Settings Error:', error);
    res.status(500).json({ success: false, message: "Failed to update regional settings" });
  }
};

// Upload user profile picture
exports.uploadProfilePicture = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!req.files || !req.files.profilePicture) {
      return res.status(400).json({ 
        success: false, 
        message: "No profile picture file uploaded" 
      });
    }

    const profilePictureFile = req.files.profilePicture;

    // Upload the profile picture to Cloudinary
    const cloudinary = require('cloudinary').v2;
    const uploadResult = await cloudinary.uploader.upload(profilePictureFile.tempFilePath, {
      folder: "user_profiles",
      transformation: [
        { width: 300, height: 300, crop: "fill" },
        { quality: "auto" }
      ]
    });

    // Update the user's profile picture URL
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        profilePicture: uploadResult.secure_url,
        updatedAt: Date.now()
      },
      { new: true }
    ).select('profilePicture fullName email');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ 
      success: true, 
      message: "Profile picture uploaded successfully",
      data: {
        profilePicture: updatedUser.profilePicture,
        user: {
          fullName: updatedUser.fullName,
          email: updatedUser.email
        }
      }
    });
  } catch (error) {
    console.error('Upload Profile Picture Error:', error);
    res.status(500).json({ success: false, message: "Failed to upload profile picture" });
  }
};

// Remove user profile picture
exports.removeProfilePicture = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // If user has a profile picture, delete it from Cloudinary
    if (user.profilePicture) {
      try {
        const cloudinary = require('cloudinary').v2;
        const publicId = user.profilePicture.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`user_profiles/${publicId}`);
      } catch (cloudinaryError) {
        console.error('Cloudinary deletion error:', cloudinaryError);
        // Continue with the update even if Cloudinary deletion fails
      }
    }

    // Update user to remove profile picture
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        profilePicture: null,
        updatedAt: Date.now()
      },
      { new: true }
    ).select('profilePicture fullName email');

    res.status(200).json({ 
      success: true, 
      message: "Profile picture removed successfully",
      data: {
        profilePicture: updatedUser.profilePicture,
        user: {
          fullName: updatedUser.fullName,
          email: updatedUser.email
        }
      }
    });
  } catch (error) {
    console.error('Remove Profile Picture Error:', error);
    res.status(500).json({ success: false, message: "Failed to remove profile picture" });
  }
};

// Get user sessions
exports.getUserSessions = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // For now, return basic session info
    // In a real implementation, you'd track sessions in a separate collection
    const sessions = [
      {
        id: 'current-session',
        device: 'Web Browser',
        location: 'Unknown',
        ipAddress: req.ip,
        lastActive: new Date(),
        isCurrent: true
      }
    ];

    res.status(200).json({ 
      success: true, 
      data: {
        sessions,
        totalSessions: sessions.length,
        activeSessions: sessions.filter(s => s.isCurrent).length
      }
    });
  } catch (error) {
    console.error('Get User Sessions Error:', error);
    res.status(500).json({ success: false, message: "Failed to get user sessions" });
  }
};

// Terminate user session
exports.terminateSession = async (req, res) => {
  try {
    const { userId, sessionId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // For now, just return success
    // In a real implementation, you'd invalidate the session token
    res.status(200).json({ 
      success: true, 
      message: "Session terminated successfully",
      data: {
        terminatedSessionId: sessionId
      }
    });
  } catch (error) {
    console.error('Terminate Session Error:', error);
    res.status(500).json({ success: false, message: "Failed to terminate session" });
  }
};

