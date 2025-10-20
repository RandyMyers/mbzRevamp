# 🔐 VERIFY TOKEN API - SWAGGER DOCUMENTATION

## 📋 **ENDPOINT OVERVIEW**

### **Endpoint:** `POST /api/auth/verify-token`
### **Purpose:** Verify JWT token validity and expiration
### **Authentication:** Not required (public endpoint)
### **Use Case:** Frontend checks if user token is still valid before making authenticated requests

---

## 🎯 **API DOCUMENTATION**

### **Request:**
```http
POST /api/auth/verify-token
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0ZjFhMmIzYzRkNWU2ZjdnOGg5aTBqMyIsImVtYWlsIjoidGVzdEB1c2VyLmNvbSIsImlhdCI6MTY5MzQ1NjAwMCwiZXhwIjoxNjk0MDYwODAwfQ.example_signature"
}
```

### **Response Examples:**

#### **✅ Success (Token Valid):**
```json
{
  "success": true,
  "valid": true,
  "expired": false,
  "message": "Token is valid",
  "user": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j3",
    "email": "test@user.com",
    "role": "admin",
    "organizationId": "67f504af91eae487185de080",
    "fullName": "John Doe",
    "username": "johndoe"
  }
}
```

#### **❌ Token Expired:**
```json
{
  "success": false,
  "valid": false,
  "expired": true,
  "message": "Token has expired"
}
```

#### **❌ Invalid Token:**
```json
{
  "success": false,
  "valid": false,
  "message": "Invalid token"
}
```

#### **❌ Token Missing:**
```json
{
  "success": false,
  "valid": false,
  "message": "Token is required"
}
```

#### **❌ User Not Found:**
```json
{
  "success": false,
  "valid": false,
  "message": "User not found"
}
```

#### **❌ Password Changed:**
```json
{
  "success": false,
  "valid": false,
  "message": "Token is no longer valid - password was changed"
}
```

---

## 🔧 **FRONTEND IMPLEMENTATION**

### **React Hook Example:**
```typescript
// useTokenVerification.ts
import { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';

interface TokenVerificationResult {
  success: boolean;
  valid: boolean;
  expired: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    role: string;
    organizationId: string;
    fullName: string;
    username: string;
  };
}

export const useTokenVerification = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<TokenVerificationResult | null>(null);

  const verifyToken = async (token: string): Promise<TokenVerificationResult> => {
    setIsVerifying(true);
    
    try {
      const response = await fetch('/api/auth/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();
      setVerificationResult(result);
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        valid: false,
        expired: false,
        message: 'Network error during token verification'
      };
      setVerificationResult(errorResult);
      return errorResult;
    } finally {
      setIsVerifying(false);
    }
  };

  return {
    verifyToken,
    isVerifying,
    verificationResult
  };
};
```

### **AuthGuard Component Example:**
```typescript
// AuthGuard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTokenVerification } from '@/hooks/useTokenVerification';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const { verifyToken, isVerifying } = useTokenVerification();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsAuthenticated(false);
        navigate('/login');
        return;
      }

      const result = await verifyToken(token);
      
      if (result.success && result.valid && !result.expired) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate, verifyToken]);

  if (isVerifying || isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Verifying authentication...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
};
```

---

## 🎯 **USE CASES**

### **1. App Initialization:**
```typescript
// Check if user is still logged in when app starts
const token = localStorage.getItem('token');
if (token) {
  const result = await verifyToken(token);
  if (!result.valid || result.expired) {
    // Redirect to login
    navigate('/login');
  }
}
```

### **2. Before API Calls:**
```typescript
// Verify token before making authenticated requests
const token = localStorage.getItem('token');
const verification = await verifyToken(token);

if (!verification.valid) {
  // Handle token invalidation
  logout();
  return;
}

// Proceed with API call
```

### **3. Periodic Token Check:**
```typescript
// Check token validity every 5 minutes
useEffect(() => {
  const interval = setInterval(async () => {
    const token = localStorage.getItem('token');
    if (token) {
      const result = await verifyToken(token);
      if (!result.valid || result.expired) {
        logout();
      }
    }
  }, 5 * 60 * 1000); // 5 minutes

  return () => clearInterval(interval);
}, []);
```

---

## 🔍 **ERROR HANDLING**

### **Token Expired:**
- **Action:** Redirect to login page
- **Message:** "Your session has expired. Please log in again."

### **Invalid Token:**
- **Action:** Clear stored token and redirect to login
- **Message:** "Invalid authentication. Please log in again."

### **User Not Found:**
- **Action:** Clear stored data and redirect to login
- **Message:** "User account not found. Please log in again."

### **Password Changed:**
- **Action:** Clear stored token and redirect to login
- **Message:** "Your password was changed. Please log in again."

### **Network Error:**
- **Action:** Show error message, allow retry
- **Message:** "Unable to verify authentication. Please check your connection."

---

## 🚀 **BENEFITS**

### **For Frontend:**
- ✅ **Automatic token validation** before API calls
- ✅ **Seamless user experience** with proper error handling
- ✅ **Security** by checking token validity
- ✅ **User session management** with clear feedback

### **For Backend:**
- ✅ **Comprehensive error handling** for all token scenarios
- ✅ **Clear response format** for easy frontend integration
- ✅ **Security validation** including password change detection
- ✅ **Detailed logging** for debugging

### **For Users:**
- ✅ **Clear error messages** when authentication fails
- ✅ **Automatic redirect** to login when needed
- ✅ **No confusion** about authentication status
- ✅ **Secure session management**

---

## 📚 **SWAGGER INTEGRATION**

The endpoint is fully documented in Swagger with:
- ✅ **Complete request/response schemas**
- ✅ **All possible error responses**
- ✅ **Example payloads**
- ✅ **Clear descriptions**
- ✅ **Proper HTTP status codes**

**Access the Swagger documentation at:** `http://localhost:8800/api-docs`

---

## 🎉 **SUMMARY**

The `verifyToken` endpoint provides:
- 🔐 **Secure token validation**
- 📱 **Frontend-friendly responses**
- 🚨 **Clear error handling**
- 📖 **Complete API documentation**
- 🎯 **Easy integration**

**This enables the frontend to properly handle authentication state and provide a seamless user experience!**


