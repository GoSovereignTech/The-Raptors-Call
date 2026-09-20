// src/lib/entityProfiles.js
// Profile lookup: nickname, role, picture per mesh node.

let _db = null;

export function setProfileDb(db) {
  _db = db;
}

export function getProfile(nodeId) {
  if (!_db || !nodeId) return null;
  try {
    const stmt = _db.prepare(
      'SELECT * FROM friend_profiles WHERE mesh_node_id = ? LIMIT 1'
    );
    stmt.bind([nodeId]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
  } catch (e) {
    console.warn('[entityProfiles] lookup failed', e);
  }
  return null;
}

export function saveProfile(profile) {
  if (!_db) return false;
  try {
    _db.run(
      `INSERT INTO friend_profiles (user_guid, mesh_node_id, nickname, full_name, role, picture_blob, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(mesh_node_id) DO UPDATE SET
         nickname = excluded.nickname,
         full_name = excluded.full_name,
         role = excluded.role,
         picture_blob = excluded.picture_blob,
         updated_at = CURRENT_TIMESTAMP`,
      [
        profile.user_guid || null,
        profile.mesh_node_id,
        profile.nickname || null,
        profile.full_name || null,
        profile.role || 'protector',
        profile.picture_blob || null,
      ]
    );
    return true;
  } catch (e) {
    console.warn('[entityProfiles] save failed', e);
    return false;
  }
}

// Merge a profile into an entity object for display
export function enrichEntity(entity) {
  if (!entity || !entity.id) return entity;
  const profile = getProfile(entity.id);
  if (!profile) return entity;
  return {
    ...entity,
    nickname: profile.nickname || entity.nickname,
    full_name: profile.full_name,
    role: profile.role,
    picture_blob: profile.picture_blob,
  };
}

// Sort comparator: alarm first, then closest, then alphabetical
export function sortEntities(entities, origin) {
  return [...entities].sort((a, b) => {
    // 1. Alarm active wins
    const aAlarm = a.alarm && a.alarm !== 'off' ? 1 : 0;
    const bAlarm = b.alarm && b.alarm !== 'off' ? 1 : 0;
    if (aAlarm !== bAlarm) return bAlarm - aAlarm;

    // 2. Distance from origin
    if (origin) {
      const distA = Math.hypot((a.lat ?? a.lng ? a.lat : 0) - origin.lat, (a.lng ?? a.lon) - origin.lon);
      const distB = Math.hypot((b.lat ?? b.lng ? b.lat : 0) - origin.lat, (b.lng ?? b.lon) - origin.lon);
      if (Math.abs(distA - distB) > 0.0001) return distA - distB;
    }

    // 3. Alphabetical by nickname/alias
    const aName = (a.nickname || a.alias || a.id || '').toLowerCase();
    const bName = (b.nickname || b.alias || b.id || '').toLowerCase();
    return aName.localeCompare(bName);
  });
}