const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/users');
const Role = require('../models/role');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');

// Debug function to decode JWT token (Node-safe)
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.log('❌ Error decoding token:', error.message);
    return null;
  }
};

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    console.log('=== AUTH MIDDLEWARE DEBUG START ===');
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);
    console.log('Request headers:', req.headers);
    
    // 1) Get token from header
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('✅ Token extracted from header');
    } else {
      console.log('❌ No Bearer token found in headers');
      console.log('Authorization header:', req.headers.authorization);
    }

    if (!token) {
      console.log('❌ No token provided');
      return next(new UnauthorizedError('You are not logged in. Please log in to get access.'));
    }

    console.log('🔍 Token length:', token.length);
    console.log('🔍 Token starts with:', token.substring(0, 20) + '...');

    // Debug: Decode token without verification
    const decodedPayload = decodeToken(token);
    console.log('🔍 Decoded token payload (without verification):', decodedPayload);

    // 2) Verify token
    console.log('🔍 Attempting to verify token...');
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    console.log('✅ Token verified successfully');
    console.log('🔍 Decoded token payload:', decoded);
    
    // Get user ID from token (check both 'id' and 'userId' fields)
    const userId = decoded.id || decoded.userId;
    console.log('🔍 User ID from token:', userId);
    console.log('🔍 User ID type:', typeof userId);
    
    if (!userId) {
      console.log('❌ No user ID found in token');
      return next(new UnauthorizedError('Invalid token: no user ID found.'));
    }

    // 3) Check if user still exists
    console.log('🔍 Looking up user in database...');
    console.log('🔍 Searching for user with ID:', userId);
    console.log('🔍 Database connection state:', require('mongoose').connection.readyState);
    console.log('🔍 Database name:', require('mongoose').connection.name);
    
    // Load user without populating to avoid changing type of `role`
    const currentUser = await User.findById(userId);
    console.log('🔍 Database lookup result:', currentUser ? 'User found' : 'User not found');
    
    if (currentUser) {
      console.log('✅ User found in database');
      console.log('🔍 User details:', {
        id: currentUser._id,
        email: currentUser.email,
        role: currentUser.role,
        organizationId: currentUser.organizationId
      });
    } else {
      console.log('❌ User not found in database');
      console.log('🔍 Searched for ID:', userId);
      console.log('🔍 ID type:', typeof userId);
      console.log('🔍 JWT_SECRET exists:', !!process.env.JWT_SECRET);
    }
    
    if (!currentUser) {
      console.log('❌ User belonging to this token no longer exists');
      return next(new UnauthorizedError('The user belonging to this token no longer exists.'));
    }

    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
      console.log('❌ User changed password after token was issued');
      return next(new UnauthorizedError('User recently changed password. Please log in again.'));
    }

    // Grant access to protected route
    console.log('✅ Authentication successful - granting access');
    req.user = currentUser;
    req.userId = currentUser._id;
    // Normalize role name for RBAC checks without mutating `req.user.role`
    if (typeof currentUser.role === 'string') {
      req.userRoleName = currentUser.role;
    } else if (currentUser.role) {
      try {
        const roleDoc = await Role.findById(currentUser.role).select('name');
        req.userRoleName = roleDoc ? roleDoc.name : undefined;
      } catch (e) {
        req.userRoleName = undefined;
      }
    } else {
      req.userRoleName = undefined;
    }
    console.log('=== AUTH MIDDLEWARE DEBUG END ===');
    next();
  } catch (error) {
    console.log('❌ Auth middleware error:', error.message);
    console.log('❌ Error stack:', error.stack);
    console.log('=== AUTH MIDDLEWARE DEBUG END ===');
    next(error);
  }
};

// Restrict access to certain roles
exports.restrictTo = (...roles) => {
  // Normalize roles: accept both 'super-admin' and 'super_admin'
  const normalize = (r) => (r || '').toString().toLowerCase().replace(/_/g, '-');
  const allowed = roles.map(normalize);
  return (req, res, next) => {
    const effectiveRole = req.userRoleName || req.user.role || '';
    const normalizedUserRole = normalize(effectiveRole);
    if (!allowed.includes(normalizedUserRole)) {
      return next(new ForbiddenError('You do not have permission to perform this action'));
    }
    next();
  };
};

// Check if user is authenticated but not required
exports.isAuthenticated = async (req, res, next) => {
  try {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
      const currentUser = await User.findById(decoded.id);
      
      if (currentUser && !currentUser.changedPasswordAfter(decoded.iat)) {
        req.user = currentUser;
      }
    }
    next();
  } catch (error) {
    next();
  }
};

// Check if user is the owner of the resource
exports.isOwner = (Model) => async (req, res, next) => {
  try {
    const doc = await Model.findById(req.params.id);
    
    if (!doc) {
      return next(new NotFoundError('No document found with that ID'));
    }

    if (doc.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ForbiddenError('You do not have permission to perform this action'));
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Check if user is part of the organization
exports.isOrganizationMember = async (req, res, next) => {
  try {
    if (!req.user.organizationId) {
      return next(new ForbiddenError('You are not part of any organization'));
    }

    if (req.params.organizationId && req.params.organizationId !== req.user.organizationId.toString()) {
      return next(new ForbiddenError('You do not have access to this organization'));
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Alias for authenticateToken (for compatibility with existing routes)
exports.authenticateToken = exports.protect; 