-- Supabase Tables (subset, from earlier schema)

-- 1. User profiles (PII-free, GUID-based)
users (guid, mesh_node_id, permission_tier, vetting_status)

-- 2. Vetting responses
vetting_responses (user_guid, question_id, response_text, risk_score)

-- 3. Ban list (Silent Ban Protocol)
bans (guid, mesh_node_id, banned_at, reason_internal)

-- 4. Historical Rewind data (optional, sync later)
rewind_logs (node_id, path, choke_point_gps, video_timestamp)

-- 5. Incident reports
incidents (id, node_id, description, timestamp, resolved)

-- 6. Team/Group assignments
teams, team_memberships
==========


The Hybrid Database Strategy
Local Database (On Each Hardened Phone)
Technology: SQLite (via react-native-sqlite-storage or expo-sqlite)

What's Stored Locally: 


-- Local Database Schema (on each phone)

-- 1. Cached user profile (from Supabase)
CREATE TABLE local_user_profile (
    guid TEXT PRIMARY KEY,
    mesh_node_id TEXT,
    permission_tier INTEGER,
    hobbies TEXT,
    interests TEXT,
    routine_patterns TEXT,
    last_sync TIMESTAMP
);

-- 2. Node positions (from LoRa mesh)
CREATE TABLE local_node_positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id TEXT,
    gps_lat REAL,
    gps_lon REAL,
    node_type TEXT, -- 'relay', 'triple_sensor', 'tag', 'unknown'
    rssi INTEGER,
    timestamp INTEGER,
    is_trusted BOOLEAN
);

-- 3. Active nodes cache (current mesh state)
CREATE TABLE local_active_nodes (
    node_id TEXT PRIMARY KEY,
    node_type TEXT,
    last_seen INTEGER,
    gps_lat REAL,
    gps_lon REAL,
    is_friend BOOLEAN
);

-- 4. Emergency alerts (pending sync)
CREATE TABLE local_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_type TEXT,
    payload TEXT,
    timestamp INTEGER,
    synced BOOLEAN DEFAULT 0
);

-- 5. Radar logs
CREATE TABLE local_radar_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_x REAL,
    target_y REAL,
    speed REAL,
    timestamp INTEGER
);