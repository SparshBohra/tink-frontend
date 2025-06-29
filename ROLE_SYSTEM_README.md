# 🏠 Tink Property Management - 3-Tier Role System

## 📋 Overview

This document outlines the implementation of the 3-tier role-based access control system for Tink Property Management platform.

## 🏗️ Role Hierarchy

### 🛡️ Platform Admin (SaaS Owner)
- **Role Code**: `admin`
- **Access Level**: Platform-wide
- **Responsibilities**:
  - Oversee entire platform
  - Manage all landlords and managers
  - Platform-wide analytics and reporting
  - System configuration and settings

### 💰 Landlord (Property Owner)
- **Role Code**: `owner`
- **Access Level**: Business-wide
- **Responsibilities**:
  - Manage their properties and rooms
  - Hire and assign managers
  - Handle tenant applications and leases
  - Business-level analytics

### ⚙️ Manager (Employee)
- **Role Code**: `manager`
- **Access Level**: Property-specific
- **Responsibilities**:
  - Work for specific landlords
  - Manage assigned properties only
  - Handle day-to-day operations
  - Property-level tasks

## 🔐 Authentication System

### Login Flow
```typescript
// Single login endpoint for all roles
POST /api/login/
{
  "username": "user_username",
  "password": "user_password"
}

// Response includes role information
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@tink.com",
    "full_name": "Platform Admin",
    "role": "admin"  // "admin" | "owner" | "manager"
  }
}
```

### Role-Based Routing
After successful login, users are automatically redirected to their role-specific dashboard:
- **Admin** → `/admin-dashboard`
- **Owner** → `/landlord-dashboard`
- **Manager** → `/manager-dashboard`

## 🎯 Demo Credentials

### Platform Admin
- **Username**: `admin`
- **Password**: `TinkAdmin2024!`
- **Description**: SaaS owner with platform-wide access

### Landlord/Owner
- **Username**: `premium_owner`
- **Password**: `demo123`
- **Description**: Property owner managing business and team

### Manager
- **Username**: `sarah_manager`
- **Password**: `demo123`
- **Description**: Employee managing day-to-day operations

## 📱 Frontend Implementation

### Authentication Context
```typescript
// lib/auth-context.tsx
const { user, isAdmin, isLandlord, isManager, hasRole, hasAnyRole } = useAuth();
```

### Role-Based Components

#### Protected Routes
```typescript
// Protect entire pages
export default withAuth(AdminDashboard, ['admin']);
export default withAuth(LandlordDashboard, ['owner']);
export default withAuth(ManagerDashboard, ['manager']);
```

#### Conditional Rendering
```typescript
// Using RoleGuard component
<RoleGuard roles={['admin', 'owner']}>
  <AdminOnlyComponent />
</RoleGuard>

// Using auth hooks
{isAdmin() && <AdminPanel />}
{isLandlord() && <BusinessTools />}
{isManager() && <OperationalTools />}
```

### Navigation System
The navigation automatically adapts based on user role:

```typescript
// Admin-only links
{isAdmin() && (
  <Link href="/admin-dashboard">🛡️ Platform Overview</Link>
)}

// Landlord-only links
{isLandlord() && (
  <Link href="/landlord-dashboard">💰 Business Overview</Link>
)}

// Manager-only links
{isManager() && (
  <Link href="/manager-dashboard">⚙️ My Tasks</Link>
)}
```

## 🎨 Dashboard Pages

### Admin Dashboard (`/admin-dashboard`)
- Platform-wide statistics
- Landlord management table
- Manager overview
- Platform revenue metrics
- Quick actions for platform administration

### Landlord Dashboard (`/landlord-dashboard`)
- Business overview metrics
- Property management cards
- Team management table
- Recent applications
- Business-focused quick actions

### Manager Dashboard (`/manager-dashboard`)
- Task-focused interface
- Assigned properties overview
- Pending tasks table
- Recent applications to review
- Operational quick actions

## 🔒 Access Control Matrix

| Feature | Admin | Owner | Manager |
|---------|-------|-------|---------|
| Platform Overview | ✅ | ❌ | ❌ |
| All Landlords | ✅ | ❌ | ❌ |
| All Managers | ✅ | ❌ | ❌ |
| Own Properties | ✅ | ✅ | ✅* |
| Hire Managers | ✅ | ✅ | ❌ |
| Tenant Management | ✅ | ✅ | ✅* |
| Applications | ✅ | ✅ | ✅* |
| Leases | ✅ | ✅ | ✅* |
| Inventory | ✅ | ✅ | ✅* |
| Financial Reports | ✅ | ✅ | ❌ |

*\* Managers only see data for their assigned properties*

## 🛠️ API Endpoints

### Authentication
- `POST /api/login/` - Universal login
- `POST /api/landlords/signup/` - Landlord registration
- `POST /api/signup/` - Manager registration

### Platform Admin
- `GET /api/landlords/` - All landlords
- `GET /api/managers/` - All managers
- `GET /api/platform/stats/` - Platform statistics

### Landlord
- `GET /api/landlords/profile/` - Own profile
- `GET /api/properties/` - Own properties
- `POST /api/manager-landlord-relationships/` - Assign managers

### Manager
- `GET /api/properties/` - Assigned properties only
- `GET /api/tenants/` - Assigned tenants only
- `GET /api/applications/` - Assigned applications only

## 🚀 Implementation Status

### ✅ Completed Features
- [x] 3-tier authentication system
- [x] Role-based routing
- [x] Protected route components
- [x] Role-specific dashboards
- [x] Adaptive navigation
- [x] Demo credentials
- [x] Role guard components
- [x] Unauthorized access handling

### 🔄 In Progress
- [ ] Backend API integration
- [ ] Manager-landlord relationship management
- [ ] Property assignment system
- [ ] Role-based data filtering

### ⏳ Planned Features
- [ ] Role permissions management
- [ ] Audit logging
- [ ] Multi-tenant data isolation
- [ ] Advanced role hierarchies

## 🧪 Testing

### Manual Testing Steps
1. **Login as Admin**:
   - Use credentials: `admin` / `TinkAdmin2024!`
   - Verify redirect to `/admin-dashboard`
   - Check platform-wide access

2. **Login as Landlord**:
   - Use credentials: `premium_owner` / `demo123`
   - Verify redirect to `/landlord-dashboard`
   - Check business-level access

3. **Login as Manager**:
   - Use credentials: `sarah_manager` / `demo123`
   - Verify redirect to `/manager-dashboard`
   - Check operational access

4. **Access Control**:
   - Try accessing unauthorized pages
   - Verify redirect to `/unauthorized`
   - Check role-based navigation visibility

## 📚 Code Structure

```
tink-frontend/
├── lib/
│   ├── auth-context.tsx      # Authentication & role management
│   ├── api.ts               # API client with role-based endpoints
│   └── types.ts             # Type definitions for roles
├── components/
│   ├── Navigation.tsx       # Role-adaptive navigation
│   └── RoleGuard.tsx       # Conditional rendering component
├── pages/
│   ├── login.tsx           # Multi-role login page
│   ├── landlord-signup.tsx # Landlord registration
│   ├── admin-dashboard.tsx # Platform admin dashboard
│   ├── landlord-dashboard.tsx # Business owner dashboard
│   ├── manager-dashboard.tsx  # Manager dashboard
│   └── unauthorized.tsx    # Access denied page
```

## 🔧 Configuration

### Environment Variables
```env
REACT_APP_API_URL=http://54.224.252.101/api
```

### Role Mapping
The system maps backend roles to frontend roles:
```typescript
// Backend → Frontend
'admin' | 'platform_admin' → 'admin'
'owner' | 'landlord' → 'owner'
'manager' | 'property_manager' → 'manager'
```

## 🎯 Best Practices

1. **Always use role guards** for sensitive components
2. **Implement progressive disclosure** based on user permissions
3. **Provide clear feedback** for unauthorized access attempts
4. **Use consistent role naming** throughout the application
5. **Test all role combinations** thoroughly

## 🐛 Troubleshooting

### Common Issues

1. **User not redirected after login**:
   - Check role mapping in auth context
   - Verify backend role field names

2. **Navigation not showing role-specific items**:
   - Ensure user object has correct role
   - Check localStorage for role persistence

3. **Unauthorized access not blocked**:
   - Verify withAuth HOC is applied
   - Check required roles array

### Debug Commands
```bash
# Check user role in browser console
localStorage.getItem('userRole')

# Check authentication state
console.log(user?.role)
```

## 📞 Support

For questions or issues with the role system implementation, please refer to:
- Authentication context: `lib/auth-context.tsx`
- Role types: `lib/types.ts`
- Demo credentials in login page
- This documentation

---

**🎯 The 3-tier role system provides a solid foundation for scalable, secure property management operations with clear separation of concerns and appropriate access controls.** 
 
 
 
 