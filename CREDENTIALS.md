# 🔑 LOGIN CREDENTIALS REFERENCE

## 👨‍💼 ADMIN ACCOUNTS

### System Administrator
- **Email**: `sysadmin@company.com`
- **Password**: `sysadmin123`
- **Role**: System Administrator
- **Access**: Full system access, user management, system settings
- **Interface**: Complete admin panel with all features

### Ticket Coordinator  
- **Email**: `coordinator@company.com`
- **Password**: `coordinator123`
- **Role**: Ticket Coordinator
- **Access**: Ticket management, assignment, basic user operations
- **Interface**: Ticket-focused admin panel

### Super Administrator
- **Email**: `superadmin@company.com`
- **Password**: `superadmin123`
- **Role**: Super Administrator
- **Access**: Everything + advanced system controls
- **Interface**: Enhanced admin panel with extra features

## 👤 EMPLOYEE ACCOUNTS

### IT Developer
- **Email**: `john.doe@company.com`
- **Password**: `employee123`
- **Role**: Developer
- **Department**: IT
- **Interface**: Standard employee dashboard

### HR Manager
- **Email**: `jane.smith@company.com`
- **Password**: `manager123`
- **Role**: Manager
- **Department**: HR
- **Interface**: Employee dashboard with manager features

### Finance Analyst
- **Email**: `mike.wilson@company.com`
- **Password**: `analyst123`
- **Role**: Analyst
- **Department**: Finance
- **Interface**: Basic employee dashboard

## 🎯 TESTING WORKFLOW

1. **Start the app**: `npm run dev`
2. **Access login page**: `http://localhost:5173/`
3. **Use any credentials above**
4. **See different interfaces** based on user role
5. **Or access pages directly** (authentication bypassed for direct URLs)

## 🛠️ DEVELOPER CONSOLE HELPERS

```javascript
// Show all credentials in console
devUtils.showCredentials()

// Get quick login info
devUtils.quickLogin('sysad')        // System Administrator
devUtils.quickLogin('coordinator')   // Ticket Coordinator
devUtils.quickLogin('employee')     // Employee

// Check current user
devUtils.showCurrentUser()
```

## 🔄 ROLE-BASED INTERFACE DIFFERENCES

### System Administrator Interface
- ✅ User Management (approve/reject users)
- ✅ System Settings
- ✅ Full Ticket Management
- ✅ Reports & Analytics
- ✅ Admin Tools

### Ticket Coordinator Interface
- ✅ Ticket Assignment
- ✅ Ticket Status Management
- ✅ Basic User Operations
- ❌ System Settings
- ❌ User Approval/Rejection

### Employee Interface
- ✅ Submit Tickets
- ✅ View Own Tickets
- ✅ Profile Settings
- ❌ Admin Features
- ❌ Other Users' Data

## 💡 TIPS

- **Login works**: Use proper email/password combinations
- **Direct access works**: Navigate to URLs without login
- **Role switching**: Login with different accounts to see interface changes
- **Console helpers**: Use `devUtils.help()` for more options
