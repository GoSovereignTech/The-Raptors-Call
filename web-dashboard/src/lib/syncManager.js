// syncManager.js
class SyncManager {
    constructor() {
        this.lastSync = localStorage.getItem('lastSync') || 0;
        this.isOnline = false; // Checked periodically
    }

    // Called when WiFi is detected
    async syncWithSupabase() {
        if (!this.isOnline) return;

        // 1. Upload pending alerts
        const pendingAlerts = await localDB.get('local_alerts', { synced: false });
        for (const alert of pendingAlerts) {
            await supabase.from('alerts').insert([alert]);
            await localDB.update('local_alerts', { id: alert.id, synced: true });
        }

        // 2. Upload Rewind logs
        const pendingRewind = await localDB.get('rewind_logs', { synced: false });
        for (const log of pendingRewind) {
            await supabase.from('rewind_logs').insert([log]);
            await localDB.update('rewind_logs', { id: log.id, synced: true });
        }

        // 3. Download updated friend list
        const user = await localDB.get('local_user_profile');
        const { data: friends } = await supabase
            .from('team_memberships')
            .select('user_guid')
            .eq('team_id', user.team_id);
        
        await localDB.update('local_user_profile', { 
            friend_list: friends.map(f => f.user_guid) 
        });

        // 4. Check for bans (Silent Ban Protocol)
        const { data: bans } = await supabase
            .from('bans')
            .select('guid')
            .eq('guid', user.guid);
        
        if (bans && bans.length > 0) {
            // User is banned - disable access
            localStorage.setItem('isBanned', 'true');
        }

        this.lastSync = Date.now();
        localStorage.setItem('lastSync', this.lastSync);
    }

    // Check for WiFi availability
    checkConnectivity() {
        this.isOnline = navigator.onLine;
        if (this.isOnline && (Date.now() - this.lastSync > 86400000)) { // 24 hours
            this.syncWithSupabase();
        }
    }
}