-- Pre-populate solitary_routines table (centralized in Supabase, synced locally)
INSERT INTO solitary_routines (id, description, category, risk_factor) VALUES
('routine_001', 'Walking to/from school', 'Student', 7),
('routine_002', 'Driving to/from school', 'Student', 5),
('routine_003', 'Walking to/from work', 'Contract Worker', 8),
('routine_004', 'Driving to/from work', 'Contract Worker', 4),
('routine_005', 'Walking to/from church', 'Religious', 6),
('routine_006', 'Driving to/from church', 'Religious', 3),
('routine_007', 'Walking to/from the gas station', 'General', 7),
('routine_008', 'Driving to/from the gas station', 'General', 3),
('routine_009', 'Walking to/from the pharmacy', 'General', 6),
('routine_010', 'Driving to/from the pharmacy', 'General', 3),
('routine_011', 'Walking to/from campus alone', 'Student', 8),
('routine_012', 'Driving to/from campus alone', 'Student', 4),
('routine_013', 'Walking to/from internships', 'Contract Worker', 8),
('routine_014', 'Driving to/from internships', 'Contract Worker', 4),
('routine_015', 'Walking to/from a new location as a truck driver', 'Truck Driver', 9),
('routine_016', 'Driving to/from a new location as a truck driver', 'Truck Driver', 7),
('routine_017', 'Meeting sex worker clients', 'Sex Worker', 10),
('routine_018', 'Walking to/from a park alone', 'General', 7),
('routine_019', 'Walking to/from hiking trails alone', 'Outdoor', 8),
('routine_020', 'Walking to/from a new job site', 'Contract Worker', 8);

-- Seed categories table (for filtering)
INSERT INTO solitary_routine_categories (category) VALUES
('Student'), ('Truck Driver'), ('Contract Worker'), ('Unhoused'), ('Sex Worker'), ('General'), ('Outdoor'), ('Religious');

-- Add to Supabase (central) and sync locally
CREATE TABLE notification_blacklist (
    user_guid UUID PRIMARY KEY REFERENCES users(guid) ON DELETE CASCADE,
    reason TEXT, -- e.g., 'low agreeableness', 'high neuroticism'
    flagged_by UUID REFERENCES users(guid),
    flagged_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP -- Optional: temporary ban
);

-- Add to local schema (same structure)