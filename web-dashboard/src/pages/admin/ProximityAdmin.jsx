// pages/admin/ProximityAdmin.jsx
// Admin page for proximity matching and team suggestions

import React, { useState, useEffect } from 'react';
import { Users, MapPin, Compass, CheckCircle2, XCircle, Search, Loader2 } from 'lucide-react';
import { ProximityMatcher } from '../../lib/proximityMatcher';
import { getDeviceDetector } from '../../lib/deviceDetector';
import { initDatabase } from '../../lib/db';

export default function ProximityAdmin() {
    const [users, setUsers] = useState([]);
    const [matches, setMatches] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [db, setDb] = useState(null);
    const [matcher, setMatcher] = useState(null);
    const [status, setStatus] = useState('');

    // Initialize database and matcher
    useEffect(() => {
        async function init() {
            try {
                const database = await initDatabase();
                setDb(database);
                const proximityMatcher = new ProximityMatcher(database);
                setMatcher(proximityMatcher);
                setStatus('ready');
                
                // Load users
                await loadUsers(database);
            } catch (error) {
                console.error('Initialization error:', error);
                setStatus('error');
            }
        }
        init();
    }, []);

    const loadUsers = async (database) => {
        if (!database) return;
        try {
            const result = await database.exec(`
                SELECT guid, mesh_node_id, agreeableness_score, neuroticism_score, vetting_status, permission_tier
                FROM local_user_profile
                ORDER BY vetting_status, guid
            `);
            if (result.length > 0) {
                const rows = result[0].values.map(row => ({
                    guid: row[0],
                    mesh_node_id: row[1],
                    agreeableness_score: row[2],
                    neuroticism_score: row[3],
                    vetting_status: row[4],
                    permission_tier: row[5]
                }));
                setUsers(rows);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const handleFindMatches = async (userGuid) => {
        if (!matcher) return;
        setLoading(true);
        try {
            const results = await matcher.findMatches(userGuid);
            setMatches(results);
            setSelectedUser(userGuid);
        } catch (error) {
            console.error('Error finding matches:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSuggestTeams = async (userGuid) => {
        if (!matcher) return;
        setLoading(true);
        try {
            const results = await matcher.suggestTeams(userGuid);
            setSuggestions(results);
            setSelectedUser(userGuid);
        } catch (error) {
            console.error('Error suggesting teams:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u => 
        u.mesh_node_id?.toLowerCase().includes(search.toLowerCase()) ||
        u.guid?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-raptor-void px-4 py-6 text-slate-100 sm:px-8">
            <div className="mx-auto max-w-4xl">
                <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-raptor-cyan" />
                        <h1 className="text-lg font-semibold text-slate-100">Proximity Matching</h1>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className={`inline-flex h-2 w-2 rounded-full ${status === 'ready' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        {status === 'ready' ? 'Ready' : 'Initializing...'}
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Users List */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                        <div className="mb-4 flex items-center gap-2">
                            <Users className="h-4 w-4 text-raptor-cyan" />
                            <h2 className="text-sm font-semibold">Vetted Users</h2>
                            <span className="ml-auto rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                                {users.length}
                            </span>
                        </div>
                        
                        <div className="mb-4">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                <input 
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by ID or node..."
                                    className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-raptor-cyan"
                                />
                            </div>
                        </div>

                        <div className="max-h-96 space-y-2 overflow-y-auto">
                            {filteredUsers.length === 0 ? (
                                <p className="text-sm text-slate-500">No users found</p>
                            ) : (
                                filteredUsers.map((user) => (
                                    <div 
                                        key={user.guid}
                                        className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                                            selectedUser === user.guid 
                                                ? 'border-raptor-cyan bg-raptor-cyan/10' 
                                                : 'border-slate-800 hover:border-slate-700'
                                        }`}
                                        onClick={() => {
                                            setSelectedUser(user.guid);
                                            handleFindMatches(user.guid);
                                        }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-medium text-slate-100">
                                                    {user.mesh_node_id || user.guid.substring(0, 8)}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <span>Agreeableness: {user.agreeableness_score || '—'}</span>
                                                    <span className="h-1 w-1 rounded-full bg-slate-700" />
                                                    <span>Neuroticism: {user.neuroticism_score || '—'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex h-2 w-2 rounded-full ${
                                                    user.vetting_status === 'APPROVED' 
                                                        ? 'bg-emerald-400' 
                                                        : user.vetting_status === 'PENDING'
                                                        ? 'bg-amber-400'
                                                        : 'bg-rose-400'
                                                }`} />
                                                <span className="text-xs text-slate-500">
                                                    {user.permission_tier === 2 ? 'T2' : 'T1'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Matches & Suggestions */}
                    <div className="space-y-6">
                        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                            <h2 className="mb-4 text-sm font-semibold text-slate-100">Matches</h2>
                            {loading ? (
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Finding matches...
                                </div>
                            ) : matches.length === 0 ? (
                                <p className="text-sm text-slate-500">
                                    {selectedUser ? 'No matches found for this user' : 'Select a user to find matches'}
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {matches.map((match, index) => (
                                        <div key={index} className="rounded-lg border border-slate-800 p-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-slate-100">
                                                    {match.mesh_node_id || match.guid.substring(0, 8)}
                                                </span>
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                    match.risk_level === 'HIGH' 
                                                        ? 'bg-rose-500/20 text-rose-400' 
                                                        : match.risk_level === 'MEDIUM'
                                                        ? 'bg-amber-500/20 text-amber-400'
                                                        : 'bg-emerald-500/20 text-emerald-400'
                                                }`}>
                                                    {match.risk_level}
                                                </span>
                                            </div>
                                            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                                <span>Match: {Math.round(match.match_score * 100)}%</span>
                                                <span className="h-1 w-1 rounded-full bg-slate-700" />
                                                <span>Agreeableness: {match.agreeableness_score || '—'}</span>
                                            </div>
                                            {match.matched_routines && match.matched_routines.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {match.matched_routines.slice(0, 3).map((routine, i) => (
                                                        <span key={i} className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                                                            {routine}
                                                        </span>
                                                    ))}
                                                    {match.matched_routines.length > 3 && (
                                                        <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-500">
                                                            +{match.matched_routines.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {selectedUser && (
                                <button
                                    onClick={() => handleSuggestTeams(selectedUser)}
                                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-raptor-cyan px-4 py-2 text-sm font-medium text-raptor-cyan hover:bg-raptor-cyan/10"
                                >
                                    <Compass className="h-4 w-4" />
                                    Suggest Teams Based on These Matches
                                </button>
                            )}
                        </div>

                        {/* Team Suggestions */}
                        {suggestions.length > 0 && (
                            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                                <h2 className="mb-4 text-sm font-semibold text-slate-100">Suggested Teams</h2>
                                <div className="space-y-3">
                                    {suggestions.map((suggestion, index) => (
                                        <div key={index} className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-emerald-300">
                                                    {suggestion.suggested_team_name}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    {suggestion.total_users} members
                                                </span>
                                            </div>
                                            <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                                                <span>Category: {suggestion.category}</span>
                                                <span className="h-1 w-1 rounded-full bg-slate-700" />
                                                <span>Match: {suggestion.avg_match_score}%</span>
                                                <span className="h-1 w-1 rounded-full bg-slate-700" />
                                                <span className={`${
                                                    suggestion.avg_risk_level === 'HIGH' 
                                                        ? 'text-rose-400' 
                                                        : suggestion.avg_risk_level === 'MEDIUM'
                                                        ? 'text-amber-400'
                                                        : 'text-emerald-400'
                                                }`}>
                                                    {suggestion.avg_risk_level}
                                                </span>
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {suggestion.users.slice(0, 5).map((user, i) => (
                                                    <span key={i} className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                                                        {user.mesh_node_id || user.guid.substring(0, 6)}
                                                    </span>
                                                ))}
                                                {suggestion.users.length > 5 && (
                                                    <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-500">
                                                        +{suggestion.users.length - 5}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}