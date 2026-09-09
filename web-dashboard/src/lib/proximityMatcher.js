// lib/proximityMatcher.js

export class ProximityMatcher {
    constructor(db) {
        this.db = db;
    }

    // Find matches for a user based on routine overlap
    async findMatches(userGuid) {
        if (!this.db) return [];

        try {
            // 1. Get user's routines
            const userRoutines = await this.query(`
                SELECT ur.routine_id, ur.routine_time, sr.description, sr.category, sr.risk_factor
                FROM user_routines ur
                JOIN solitary_routines sr ON ur.routine_id = sr.id
                WHERE ur.user_guid = ? AND ur.is_active = 1
            `, [userGuid]);

            if (userRoutines.length === 0) return [];

            // 2. Find other users with matching routines
            const routineIds = userRoutines.map(r => `'${r.routine_id}'`).join(',');
            const matches = await this.query(`
                SELECT DISTINCT 
                    u.guid, 
                    u.mesh_node_id, 
                    u.agreeableness_score, 
                    u.neuroticism_score,
                    u.vetting_status,
                    GROUP_CONCAT(ur.routine_id) as matching_routines,
                    COUNT(DISTINCT ur.routine_id) as routine_count
                FROM local_user_profile u
                JOIN user_routines ur ON u.guid = ur.user_guid
                WHERE ur.routine_id IN (${routineIds})
                  AND u.guid != ?
                  AND u.vetting_status = 'APPROVED'
                  AND u.permission_tier >= 1
                  AND ur.is_active = 1
                GROUP BY u.guid
                HAVING routine_count > 0
            `, [userGuid]);

            // 3. Filter by agreeableness (exclude low-agreeableness users)
            const filtered = matches.filter(m => m.agreeableness_score >= 50);

            // 4. Score each match
            for (const match of filtered) {
                const matchedRoutines = match.matching_routines ? match.matching_routines.split(',') : [];
                const overlap = matchedRoutines.filter(id => 
                    userRoutines.some(ur => ur.routine_id === id)
                ).length;
                match.match_score = overlap / userRoutines.length;
                
                // Get actual routine descriptions
                match.matched_routines = [];
                for (const routineId of matchedRoutines) {
                    const found = userRoutines.find(ur => ur.routine_id === routineId);
                    if (found) {
                        match.matched_routines.push(found.description);
                    }
                }
                
                // Determine risk level (based on risk_factor of matched routines)
                const maxRisk = Math.max(...userRoutines
                    .filter(ur => matchedRoutines.includes(ur.routine_id))
                    .map(ur => ur.risk_factor || 1));
                match.risk_level = maxRisk >= 8 ? 'HIGH' : maxRisk >= 5 ? 'MEDIUM' : 'LOW';
            }

            // 5. Sort by match score (highest first)
            return filtered.sort((a, b) => b.match_score - a.match_score);

        } catch (error) {
            console.error('Proximity matching error:', error);
            return [];
        }
    }

    // Suggest team formations based on matches
    async suggestTeams(userGuid) {
        const matches = await this.findMatches(userGuid);
        if (matches.length < 2) return [];

        try {
            // Group by routine category
            const grouped = {};
            for (const match of matches) {
                const routineInfo = await this.query(`
                    SELECT sr.category 
                    FROM user_routines ur
                    JOIN solitary_routines sr ON ur.routine_id = sr.id
                    WHERE ur.user_guid = ? AND ur.is_active = 1
                    LIMIT 1
                `, [match.guid]);
                
                const category = routineInfo[0]?.category || 'General';
                if (!grouped[category]) grouped[category] = [];
                grouped[category].push(match);
            }

            // For each category with 2+ users, suggest a team
            const suggestions = [];
            for (const [category, users] of Object.entries(grouped)) {
                if (users.length >= 2) {
                    const avgScore = users.reduce((sum, u) => sum + u.match_score, 0) / users.length;
                    const avgRisk = users.reduce((sum, u) => {
                        const riskVal = u.risk_level === 'HIGH' ? 3 : u.risk_level === 'MEDIUM' ? 2 : 1;
                        return sum + riskVal;
                    }, 0) / users.length;
                    
                    suggestions.push({
                        category,
                        users: users.map(u => ({
                            guid: u.guid,
                            mesh_node_id: u.mesh_node_id,
                            match_score: u.match_score,
                            risk_level: u.risk_level
                        })),
                        avg_match_score: Math.round(avgScore * 100),
                        avg_risk_level: avgRisk >= 2.5 ? 'HIGH' : avgRisk >= 1.5 ? 'MEDIUM' : 'LOW',
                        total_users: users.length,
                        suggested_team_name: `${category} Proximity Group`
                    });
                }
            }

            return suggestions.sort((a, b) => b.avg_match_score - a.avg_match_score);

        } catch (error) {
            console.error('Team suggestion error:', error);
            return [];
        }
    }

    // Get all users for a specific routine
    async getUsersByRoutine(routineId) {
        try {
            const users = await this.query(`
                SELECT u.guid, u.mesh_node_id, u.agreeableness_score, ur.routine_time
                FROM local_user_profile u
                JOIN user_routines ur ON u.guid = ur.user_guid
                WHERE ur.routine_id = ?
                  AND u.vetting_status = 'APPROVED'
                  AND u.permission_tier >= 1
                  AND ur.is_active = 1
            `, [routineId]);
            return users;
        } catch (error) {
            console.error('Error fetching users by routine:', error);
            return [];
        }
    }

    // Query helper
    async query(sql, params = []) {
        return new Promise((resolve, reject) => {
            try {
                const stmt = this.db.prepare(sql);
                const result = stmt.bind(params);
                const rows = [];
                while (result.step()) {
                    rows.push(result.get());
                }
                resolve(rows);
            } catch (error) {
                reject(error);
            }
        });
    }
}