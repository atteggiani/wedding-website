// =====================
// Initialise page
// =====================

// Database initialisation
let supabaseClient = createSupabaseClient();

// Restore state or load RSVP password input
$(async function () {
    try {
        if (!restoreGuestSession(supabaseClient)) {
            return;
        }
        
        const { data, error } = await supabaseClient
            .from('contacts')
            .select('*')
            .single();
        
        if (error) {
            throw error;
        }
        const { phone_ell, phone_davide, phone_jen } = data;
        // Display phone numbers and remove hidden class
        $('#phone_ell')
            .text(phone_ell)
            .removeClass('hidden');

        $('#phone_davide')
            .text(phone_davide)
            .removeClass('hidden');

        $('#phone_jen')
            .text(phone_jen)
            .removeClass('hidden');


    } catch (err) {
        clearSupabaseClientJWT(supabaseClient);
        clearSession();
    }
});