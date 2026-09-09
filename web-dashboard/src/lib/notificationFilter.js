// lib/notificationFilter.js

import { crypto } from 'crypto';

class NotificationFilter {
    constructor(db) {
        this.db = db;
        this.SPECIAL_KEY_SECRET = process.env.SPECIAL_KEY_SECRET || 'raptors-call-secret-key';
    }

    // Check if a user can receive a notification
    async canReceiveNotification(userGuid, notificationType, specialKey = null) {
        // If special key is provided, bypass checks
        if (specialKey && this.validateSpecialKey(specialKey, userGuid, notificationType)) {
            return { allowed: true, reason: 'special_key_valid' };
        }

        try {
            // 1. Check if user exists and has permissions
            const user = await this.query(`
                SELECT permission_tier, agreeableness_score, neuroticism_score, vetting_status
                FROM local_user_profile
                WHERE guid = ?
            `, [userGuid]);

            if (user.length === 0) {
                return { allowed: false, reason: 'user_not_found' };
            }

            const u = user[0];

            if (u.permission_tier < 1) {
                return { allowed: false, reason: 'insufficient_permission' };
            }

            if (u.vetting_status !== 'APPROVED') {
                return { allowed: false, reason: 'not_vetted' };
            }

            // 2. Check notification blacklist for recruitment/training
            if (['RECRUITMENT', 'TRAINING', 'NEW_TEAM', 'PRESENTATION'].includes(notificationType)) {
                const blacklisted = await this.query(`
                    SELECT * FROM notification_blacklist 
                    WHERE user_guid = ?
                `, [userGuid]);

                if (blacklisted.length > 0) {
                    const entry = blacklisted[0];
                    // Check if expired
                    if (entry.expires_at && new Date(entry.expires_at) < new Date()) {
                        // Expired - remove from blacklist
                        await this.query(
                            'DELETE FROM notification_blacklist WHERE user_guid = ?',
                            [userGuid]
                        );
                    } else {
                        return { 
                            allowed: false, 
                            reason: 'blacklisted',
                            reason_detail: entry.reason,
                            expires_at: entry.expires_at
                        };
                    }
                }

                // 3. Check agreeableness score (threshold: 50/100)
                if (u.agreeableness_score !== null && u.agreeableness_score < 50) {
                    return { 
                        allowed: false, 
                        reason: 'low_agreeableness',
                        score: u.agreeableness_score,
                        threshold: 50
                    };
                }

                // 4. Check neuroticism for sensitive notifications
                if (notificationType === 'SENSITIVE_UPDATE' && u.neuroticism_score > 80) {
                    return { 
                        allowed: false, 
                        reason: 'high_neuroticism',
                        score: u.neuroticism_score,
                        threshold: 80
                    };
                }
            }

            return { allowed: true, reason: 'allowed' };

        } catch (error) {
            console.error('Notification filter error:', error);
            return { allowed: false, reason: 'error', error: error.message };
        }
    }

    // Get eligible users for a notification
    async getEligibleUsers(notificationType, excludeGuids = [], specialKey = null) {
        try {
            const excludeStr = excludeGuids.map(g => `'${g}'`).join(',');
            const users = await this.query(`
                SELECT guid, mesh_node_id, agreeableness_score, neuroticism_score
                FROM local_user_profile
                WHERE permission_tier >= 1
                  AND vetting_status = 'APPROVED'
                  ${excludeGuids.length > 0 ? `AND guid NOT IN (${excludeStr})` : ''}
            `);

            const eligible = [];
            for (const user of users) {
                // Check if special key is provided for this user
                const userSpecialKey = specialKey || null;
                const result = await this.canReceiveNotification(
                    user.guid, 
                    notificationType, 
                    userSpecialKey
                );
                if (result.allowed) {
                    eligible.push(user.guid);
                }
            }
            return eligible;

        } catch (error) {
            console.error('Error getting eligible users:', error);
            return [];
        }
    }

    // Generate a special key for bypassing blacklist
    generateSpecialKey(eventId, userGuid) {
        const timestamp = Date.now();
        const hmac = crypto.createHmac('sha256', this.SPECIAL_KEY_SECRET);
        hmac.update(`${eventId}:${userGuid}:${timestamp}`);
        return {
            key: hmac.digest('hex').substring(0, 16),
            timestamp: timestamp,
            expires_in: 24 * 60 * 60 * 1000 // 24 hours
        };
    }

    // Validate a special key
    validateSpecialKey(specialKey, userGuid, eventId) {
        // Recompute the expected key
        const expected = this.generateSpecialKey(eventId, userGuid);
        const isMatch = specialKey === expected.key;

        // Check if expired
        const isExpired = (Date.now() - expected.timestamp) > expected.expires_in;

        return isMatch && !isExpired;
    }

    // Add user to blacklist
    async addToBlacklist(userGuid, reason, flaggedBy, expiresAt = null) {
        try {
            await this.query(`
                INSERT OR REPLACE INTO notification_blacklist (user_guid, reason, flagged_by, expires_at)
                VALUES (?, ?, ?, ?)
            `, [userGuid, reason, flaggedBy, expiresAt]);
            return { success: true };
        } catch (error) {
            console.error('Error adding to blacklist:', error);
            return { success: false, error: error.message };
        }
    }

    // Remove user from blacklist
    async removeFromBlacklist(userGuid) {
        try {
            await this.query(
                'DELETE FROM notification_blacklist WHERE user_guid = ?',
                [userGuid]
            );
            return { success: true };
        } catch (error) {
            console.error('Error removing from blacklist:', error);
            return { success: false, error: error.message };
        }
    }

    // Query helper (same as proximityMatcher)
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

export default NotificationFilter;