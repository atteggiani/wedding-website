const COOKIE_JWT = 'guest_jwt';
const COOKIE_JWT_EXP = 'guest_jwt_exp';

// =====================
// Supabase helpers
// =====================

// Helper function to create a supabase Client without auth
function createSupabaseClient() {
    const SUPABASE_URL = 'https://bcyxjsqpvkywiuvaskvs.supabase.co'
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjeXhqc3Fwdmt5d2l1dmFza3ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3ODk0MjMsImV4cCI6MjA3OTM2NTQyM30.zLQ9S78OPKE0vXYrqbd3BB2jsvtr9HE6bCHuLY-ecyY'
    return supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        }
    );
}

// Add JWT token to client headers
function setSupabaseClientJWT(client, jwt) {
    client.rest.headers.set(
        'Authorization',
        `Bearer ${jwt}`
    );
}

// Clear JWT token from client headers
function clearSupabaseClientJWT(client) {
    client.rest.headers.delete('Authorization');
}
// =====================
// Session helpers
// =====================
// Try to restore guest session from sessionStorage, returns true if successful
function restoreGuestSession(client) {
    const jwt = sessionStorage.getItem(COOKIE_JWT);
    const exp = sessionStorage.getItem(COOKIE_JWT_EXP);

    if (!jwt || !exp) return false;

    if (Date.now() >= Number(exp)) {
        sessionStorage.removeItem(COOKIE_JWT);
        sessionStorage.removeItem(COOKIE_JWT_EXP);
        return false;
    }

    setSupabaseClientJWT(client, jwt);
    return true;
}

function clearSession() {
    sessionStorage.removeItem(COOKIE_JWT);
    sessionStorage.removeItem(COOKIE_JWT_EXP);
}