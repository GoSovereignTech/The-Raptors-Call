-- Local SQLite Schema (on each hardened phone)

-- 1. User profile (core)
CREATE TABLE local_user_profile (
    guid TEXT PRIMARY KEY,
    mesh_node_id TEXT UNIQUE,
    permission_tier INTEGER DEFAULT 1,
    agreeableness_score REAL, -- 0-100 from Big Five
    neuroticism_score REAL, -- 0-100 from Big Five
    vetting_status TEXT DEFAULT 'PENDING', -- 'PENDING' | 'APPROVED' | 'FLAGGED'
    team_id TEXT, -- Optional team assignment
    last_sync TIMESTAMP
);

-- 2. Hobbies (foreign key table)
CREATE TABLE hobbies (
    id TEXT PRIMARY KEY, -- e.g., 'hobby_001'
    name TEXT UNIQUE, -- e.g., 'jogging', 'photography'
    category TEXT -- e.g., 'outdoor', 'indoor', 'social'
);

-- 3. Interests (foreign key table)
CREATE TABLE interests (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE,
    category TEXT -- e.g., 'career', 'social', 'educational'
);

-- 4. Solitary Routines (foreign key table) - YOUR SUGGESTION
CREATE TABLE solitary_routines (
    id TEXT PRIMARY KEY, -- e.g., 'routine_001'
    description TEXT UNIQUE, -- e.g., 'Walking to/from school'
    category TEXT, -- e.g., 'Student', 'Truck Driver', 'Contract Worker', 'Unhoused'
    risk_factor INTEGER DEFAULT 1 -- 1-10, higher = more dangerous
);

-- 5. User-to-Hobbies mapping
CREATE TABLE user_hobbies (
    user_guid TEXT REFERENCES local_user_profile(guid) ON DELETE CASCADE,
    hobby_id TEXT REFERENCES hobbies(id) ON DELETE CASCADE,
    PRIMARY KEY (user_guid, hobby_id)
);

-- 6. User-to-Interests mapping
CREATE TABLE user_interests (
    user_guid TEXT REFERENCES local_user_profile(guid) ON DELETE CASCADE,
    interest_id TEXT REFERENCES interests(id) ON DELETE CASCADE,
    PRIMARY KEY (user_guid, interest_id)
);

-- 7. User-to-Routines mapping (critical for proximity matching)
CREATE TABLE user_routines (
    user_guid TEXT REFERENCES local_user_profile(guid) ON DELETE CASCADE,
    routine_id TEXT REFERENCES solitary_routines(id) ON DELETE CASCADE,
    routine_time TEXT, -- e.g., 'weekday 8:15am', 'weekend 10am'
    is_active BOOLEAN DEFAULT 1,
    PRIMARY KEY (user_guid, routine_id)
);

-- 8. Teams (for proximity initiatives)
CREATE TABLE teams (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    activity_type TEXT, -- 'SCHOOL_GROUP', 'WORK_GROUP', 'HIKE_GROUP', 'GENERAL'
    created_by TEXT REFERENCES local_user_profile(guid),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
);

-- 9. Team Memberships (everyone can be in multiple teams)
CREATE TABLE team_memberships (
    team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
    user_guid TEXT REFERENCES local_user_profile(guid) ON DELETE CASCADE,
    is_team_lead BOOLEAN DEFAULT 0,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (team_id, user_guid)
);

-- 10. Notification Blacklist (for low-agreeableness/high-neuroticism users)
-- This prevents certain users from receiving recruitment/training invites
CREATE TABLE notification_blacklist (
    user_guid TEXT PRIMARY KEY REFERENCES local_user_profile(guid) ON DELETE CASCADE,
    reason TEXT, -- e.g., 'low agreeableness', 'high neuroticism'
    flagged_by TEXT REFERENCES local_user_profile(guid),
    flagged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);