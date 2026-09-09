// src/App.jsx
import React, { useState, useEffect } from 'react';
import { initDatabase } from './lib/db';

export default function App() {
    const [dbReady, setDbReady] = useState(false);
    const [dbError, setDbError] = useState(null);

    useEffect(() => {
        // Initialize database when the app starts
        async function setupDatabase() {
            try {
                const db = await initDatabase();
                console.log('Database initialized successfully');
                setDbReady(true);
            } catch (error) {
                console.error('Database initialization failed:', error);
                setDbError(error.message);
            }
        }
        
        setupDatabase();
    }, []);

    if (dbError) {
        return <div>Database error: {dbError}</div>;
    }

    if (!dbReady) {
        return <div>Initializing database...</div>;
    }

    // Your app content
    return (
        <div>
            <h1>Raptor's Call</h1>
            {/* Rest of your app */}
        </div>
    );
}