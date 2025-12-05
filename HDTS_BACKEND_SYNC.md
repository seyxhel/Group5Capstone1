## Backend HDTS User Sync Implementation

### Models Created

**1. HDTSUser Model** (`core/models.py`)
- Stores synced HDTS user information from auth service
- Fields: hdts_user_id, email, username, first_name, last_name, full_name, phone_number, company_id, department, status, is_active, is_staff, profile_picture, date_joined, approved_at, rejected_at, last_synced_at, created_at
- Indexes on: hdts_user_id, email, company_id, status for fast lookups
- Relationships: One-to-many with HDTSUserRole

**2. HDTSUserRole Model** (`core/models.py`)
- Stores HDTS user role assignments synced from auth service
- Fields: hdts_user_role_id, role_name, role_id, assigned_at, is_active, settings (JSON), last_synced_at, created_at
- Foreign key to HDTSUser with cascade delete
- Unique constraint on (hdts_user, role_name) to prevent duplicate role assignments
- Indexes on: (hdts_user, role_name), role_name

### Celery Tasks Created

**1. process_hdts_user_sync** (`core/tasks.py`)
- Task name: `hdts.consumer.process_user_sync`
- Receives user sync messages from auth service
- Actions supported: create, update, delete
- Creates/updates HDTSUser records with all profile data
- Deletes user records on delete action
- Includes error handling and logging

**2. process_hdts_user_system_role_sync** (`core/tasks.py`)
- Task name: `hdts.consumer.process_user_system_role_sync`
- Receives user role assignment sync messages from auth service
- Actions supported: create, update, delete
- Creates/updates HDTSUserRole records
- Creates placeholder HDTSUser if needed (for cases where role sync arrives before user sync)
- Deletes role assignments on delete action
- Includes error handling and logging

### Signals Created

**File: `core/signals.py`**
- `hdts_user_post_save`: Triggered when HDTSUser is created/updated locally
- `hdts_user_post_delete`: Triggered when HDTSUser is deleted locally
- `hdts_user_role_post_save`: Triggered when HDTSUserRole is created/updated locally
- `hdts_user_role_post_delete`: Triggered when HDTSUserRole is deleted locally

### Configuration Updates

**`core/apps.py`**
- Updated CoreConfig to call `ready()` method
- Imports signals module to register signal handlers

### Message Queue Configuration

The backend listens to two queues:
1. **hdts.user.sync** - User profile and status updates
   - Routes to: `hdts.consumer.process_user_sync`
   - Receives: Full user data with action type

2. **hdts.user_system_role.sync** - User role assignment updates
   - Routes to: `hdts.consumer.process_user_system_role_sync`
   - Receives: Role assignment data with action type

### Data Flow

```
Auth Service (auth2) -> Signals + Celery Tasks -> Message Broker
                                                         ↓
                                              Backend (core)
                                              ↓ Celery Tasks
                                          HDTSUser Model
                                          HDTSUserRole Model
```

### Next Steps

1. Run migrations: `python manage.py makemigrations core`
2. Apply migrations: `python manage.py migrate core`
3. Configure Celery to consume from hdts.user.sync and hdts.user_system_role.sync queues
4. Test the message flow with auth service changes
