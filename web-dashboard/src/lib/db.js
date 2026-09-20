// lib/db.js 
// lib/db.js - Database connection and initialization

import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

let db = null;

export async function initDatabase() {
    if (db) return db;

    const sqlite3 = await sqlite3InitModule({
        print: console.log,
        printErr: console.error,
    });

    db = new sqlite3.oo1.OpfsDb('/raptors-call.db');
    
    // Create tables
    await createTables(db);
    
    return db;
}

async function createTables(db) {
    // Users table
    db.exec(`
        CREATE TABLE IF NOT EXISTS local_user_profile (
            guid TEXT PRIMARY KEY,
            mesh_node_id TEXT UNIQUE,
            permission_tier INTEGER DEFAULT 1,
            agreeableness_score REAL,
            neuroticism_score REAL,
            vetting_status TEXT DEFAULT 'PENDING',
            team_id TEXT,
            last_sync TIMESTAMP
        )
    `);

     db.exec(`
        CREATE TABLE IF NOT EXISTS friend_profiles (
            user_guid TEXT PRIMARY KEY,
            mesh_node_id TEXT UNIQUE,
            nickname TEXT,
            full_name TEXT,
            role TEXT DEFAULT 'protector',
            picture_blob TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_friend_profiles_node ON friend_profiles(mesh_node_id);
    `);

    // Hobbies
    db.exec(`
        CREATE TABLE IF NOT EXISTS hobbies (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE,
            category TEXT
        )
    `);

    // Interests
    db.exec(`
        CREATE TABLE IF NOT EXISTS interests (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE,
            category TEXT
        )
    `);

    // Solitary Routines
    db.exec(`
        CREATE TABLE IF NOT EXISTS solitary_routines (
            id TEXT PRIMARY KEY,
            description TEXT UNIQUE,
            category TEXT,
            risk_factor INTEGER DEFAULT 1
        )
    `);

    // User-to-Hobbies mapping
    db.exec(`
        CREATE TABLE IF NOT EXISTS user_hobbies (
            user_guid TEXT REFERENCES local_user_profile(guid) ON DELETE CASCADE,
            hobby_id TEXT REFERENCES hobbies(id) ON DELETE CASCADE,
            PRIMARY KEY (user_guid, hobby_id)
        )
    `);

    // User-to-Interests mapping
    db.exec(`
        CREATE TABLE IF NOT EXISTS user_interests (
            user_guid TEXT REFERENCES local_user_profile(guid) ON DELETE CASCADE,
            interest_id TEXT REFERENCES interests(id) ON DELETE CASCADE,
            PRIMARY KEY (user_guid, interest_id)
        )
    `);

    // User-to-Routines mapping
    db.exec(`
        CREATE TABLE IF NOT EXISTS user_routines (
            user_guid TEXT REFERENCES local_user_profile(guid) ON DELETE CASCADE,
            routine_id TEXT REFERENCES solitary_routines(id) ON DELETE CASCADE,
            routine_time TEXT,
            is_active BOOLEAN DEFAULT 1,
            PRIMARY KEY (user_guid, routine_id)
        )
    `);

    // Teams
    db.exec(`
        CREATE TABLE IF NOT EXISTS teams (
            id TEXT PRIMARY KEY,
            name TEXT,
            description TEXT,
            activity_type TEXT,
            created_by TEXT REFERENCES local_user_profile(guid),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT 1
        )
    `);

    // Team Memberships
    db.exec(`
        CREATE TABLE IF NOT EXISTS team_memberships (
            team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
            user_guid TEXT REFERENCES local_user_profile(guid) ON DELETE CASCADE,
            is_team_lead BOOLEAN DEFAULT 0,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (team_id, user_guid)
        )
    `);

    // Notification Blacklist
    db.exec(`
        CREATE TABLE IF NOT EXISTS notification_blacklist (
            user_guid TEXT PRIMARY KEY REFERENCES local_user_profile(guid) ON DELETE CASCADE,
            reason TEXT,
            flagged_by TEXT REFERENCES local_user_profile(guid),
            flagged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP
        )
    `);

    // Seed initial data
    await seedInitialData(db);
}

async function seedInitialData(db) {
    // Seed solitary_routines
    const routines = [
        ['routine_001', 'Walking to/from school', 'Student', 7],
        ['routine_002', 'Driving to/from school', 'Student', 5],
        ['routine_003', 'Walking to/from work', 'Contract Worker', 8],
        ['routine_004', 'Driving to/from work', 'Contract Worker', 4],
        ['routine_005', 'Walking to/from church', 'Religious', 6],
        ['routine_006', 'Driving to/from church', 'Religious', 3],
        ['routine_007', 'Walking to/from the gas station', 'General', 7],
        ['routine_008', 'Driving to/from the gas station', 'General', 3],
        ['routine_009', 'Walking to/from the pharmacy', 'General', 6],
        ['routine_010', 'Driving to/from the pharmacy', 'General', 3],
        ['routine_011', 'Walking to/from campus alone', 'Student', 8],
        ['routine_012', 'Driving to/from campus alone', 'Student', 4],
        ['routine_013', 'Walking to/from internships', 'Contract Worker', 8],
        ['routine_014', 'Driving to/from internships', 'Contract Worker', 4],
        ['routine_015', 'Walking to/from a new location as a truck driver', 'Truck Driver', 9],
        ['routine_016', 'Driving to/from a new location as a truck driver', 'Truck Driver', 7],
        ['routine_017', 'Meeting sex worker clients', 'Sex Worker', 10],
        ['routine_018', 'Walking to/from a park alone', 'General', 7],
        ['routine_019', 'Walking to/from hiking trails alone', 'Outdoor', 8],
        ['routine_020', 'Walking to/from a new job site', 'Contract Worker', 8],
    ];

    for (const r of routines) {
        db.exec(`
            INSERT OR IGNORE INTO solitary_routines (id, description, category, risk_factor)
            VALUES ('${r[0]}', '${r[1]}', '${r[2]}', ${r[3]})
        `);
    }

    // Seed hobbies
    const hobbies = [
        ['hobby_001', 'jogging', 'outdoor'],
        ['hobby_002', 'photography', 'indoor'],
        ['hobby_003', 'reading', 'indoor'],
        ['hobby_004', 'hiking', 'outdoor'],
        ['hobby_005', 'basketball', 'sports'],
        ['hobby_006', 'painting', 'creative'],
    ];

    for (const h of hobbies) {
        db.exec(`
            INSERT OR IGNORE INTO hobbies (id, name, category)
            VALUES ('${h[0]}', '${h[1]}', '${h[2]}')
        `);
    }
}