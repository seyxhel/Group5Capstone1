#!/usr/bin/env python
"""
Update user ID 25 profile_picture to use default avatar icon.
This script directly updates the auth database.
"""
import sqlite3
import os

# Path to auth database
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'auth', 'db.sqlite3')

# Default avatar path - actual file in auth/media/profile_pics/
DEFAULT_AVATAR_PATH = 'profile_pics/default-avatar-icon-of-social-media-user-vector.jpg'

def main():
    if not os.path.exists(DB_PATH):
        print(f"ERROR: Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Update users 24 and 25
    user_ids = [24, 25]
    
    for user_id in user_ids:
        # Check if user exists
        cursor.execute("SELECT id, first_name, last_name, email, profile_picture FROM users_user WHERE id=?", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            print(f"User with ID {user_id} not found in auth database.")
            continue
        
        uid, first_name, last_name, email, current_profile = user
        print(f"\nFound user {user_id}: {first_name} {last_name} ({email})")
        print(f"Current profile_picture: {current_profile}")
        
        # Update profile_picture to default gray silhouette avatar
        cursor.execute("UPDATE users_user SET profile_picture=? WHERE id=?", (DEFAULT_AVATAR_PATH, user_id))
        conn.commit()
        
        # Verify update
        cursor.execute("SELECT profile_picture FROM users_user WHERE id=?", (user_id,))
        updated = cursor.fetchone()
        
        print(f"Updated profile_picture to: {updated[0]}")
        print(f"✓ User {user_id} profile_picture successfully updated to default gray silhouette avatar!")
    
    conn.close()

if __name__ == '__main__':
    main()
