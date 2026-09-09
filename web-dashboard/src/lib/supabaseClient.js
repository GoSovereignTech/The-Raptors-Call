import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = process.env.REACT_APP_SUPABASE_URL; // Or your direct URL
// const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwem13bG1jZ2tnamZmZ2J5Y21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDkzMTAsImV4cCI6MjEwMjcyNTMxMH0.xNis2OfbqhJS7IABvGgGuIWNtOBjiHuyiLVNgeqewRc"; //process.env.REACT_APP_SUPABASE_ANON_KEY; // Or your direct Anon Key

const supabaseUrl = "https://rpzmwlmcgkgjffgbycmb.supabase.co";
const supabaseAnonKey = "sb_publishable_IeXJuTRmX6LEqEfJQN5J-A_tcHl-3XT";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
 