const COOKIE_JWT='guest_jwt'
const COOKIE_JWT_EXP='guest_jwt_exp'

function restoreGuestSession() {
    const jwt = sessionStorage.getItem(COOKIE_JWT);
    const exp = sessionStorage.getItem(COOKIE_JWT_EXP);

    if (!jwt || !exp) return false;

    // Expired?
    if (Date.now() >= Number(exp)) {
        sessionStorage.clear();
        return false;
    }

    setSupabaseClientJWT(jwt);
    return true;
}

// Store JWT in sessionStorage
function storeGuestJWT(jwt) {
    const payload = JSON.parse(atob(jwt.split('.')[1]));

    sessionStorage.setItem(COOKIE_JWT, jwt);
    sessionStorage.setItem(COOKIE_JWT_EXP, payload.exp * 1000);
}

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
function setSupabaseClientJWT(jwt) {
    supabaseClient.rest.headers.set(
        'Authorization',
        `Bearer ${jwt}`
    );
}

// Clear JWT token from client headers
function clearSupabaseClientJWT() {
    supabaseClient.rest.headers.delete('Authorization');
}

// Set loading spinner button
function setLoading(isLoading) {
    const btn = $('#load-rsvp');

    if (isLoading) {
        btn.prop('disabled', true);
        btn.html(`
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        Verifying...
        `);
    } else {
        btn.prop('disabled', false);
        btn.text('Continue');
    }
}

function showPageLoader() {
    $('#password-input').addClass('d-none');
    $('#page-loader').removeClass('d-none');
}

function hidePageLoader() {
    $('#page-loader').addClass('d-none');
}

// Run Supabase Edge function to get a guest session to authenticate the user if the rsvp_token matches
async function getGuestJWT(rsvpPassword, supabaseClient) {
    const res = await supabaseClient.functions.invoke(
        'guest-issue-jwt',
        {
            body: { rsvp_password: rsvpPassword }
        }
    );

    if (res.error) {
        if (res.error.context?.status === 401) {
            $('#password-input > .status-text').text(
                "Oops! The RSVP password you entered is invalid. Check the invitation for your code. If you can’t find it, please contact us!"
            );
        } else {
            $('#password-input > .status-text').text(
                "There was an error validating the RSVP password! Please try again. If the error persists, please contact us!"
            );
            console.log(res.error);
        }
        return
    }
    return res.data.access_token;
}

$('#load-rsvp').on('click', async function () {
    const rsvpPassword = $('#rsvp-password').val().trim();
    if (!rsvpPassword) return;
    $('#password-input > .status-text').text("")
    setLoading(true);
    // Get Guest JWT
    const JWT = await getGuestJWT(rsvpPassword, supabaseClient);
    if (JWT) {
        storeGuestJWT(JWT);
        setSupabaseClientJWT(JWT);
        const { data, error } = await supabaseClient
            .from('guests')
            .select('*')
            .single();
        setLoading(false);
        if (!error) {
            renderGuests(data.group_members);
        } else {
            $('#password-input > .status-text').text(
                `There was an error retrieving data associated with guest '${rsvpPassword}'! Please try again. If the error persists, please contact us!`
            );
            console.log(error);
        }
    }
});

function renderGuests(members) {
    console.log(members);
    const container = $('#guests-container');
    container.empty();
    members.forEach(member => {
        container.append(`
            <div class="card mb-3 p-3">
            <h5>${member.name}</h5>
            <div class="form-floating">
            <textarea class="form-control" placeholder="Leave a comment here" id="floatingTextarea_${member.id}"></textarea>
            <label for="floatingTextarea_${member.id}">Comments</label>
            </div>
            </div>
        `)
    });
    $('#password-input').addClass('d-none');
    $('#rsvp-form').removeClass('d-none');
};

// Database initialisation
let supabaseClient = createSupabaseClient();

// Restore state or load RSVP password input
$(async function () {
    showPageLoader();
    try {
        if (!restoreGuestSession()) {
            $('#password-input').removeClass('d-none');
            return;
        }

        const { data, error } = await supabaseClient
            .from('guests')
            .select('*')
            .single();
        
        if (error) {
            throw error;
        }

        renderGuests(data.group_members);

    } catch (err) {
        console.log(err)
        clearSupabaseClientJWT();
        sessionStorage.clear();
        $('#password-input').removeClass('d-none');

    } finally {
        hidePageLoader();
    }
});

//           ${member.plusone ? `
//             <div class="mb-2">
//               <p>This invitation includes a +1</p>
//               <input class="form-control plusone-name" 
//                      data-id="${member.id}"
//                      placeholder="Plus one name"
//                      value="${existing.plusone_name || ''}">
//             </div>
//           ` : ''}

//           <div class="mb-2">
//             <label>Attending?</label>
//             <select class="form-select attending" data-id="${member.id}">
//               <option value="yes" ${existing.attending ? 'selected' : ''}>Yes</option>
//               <option value="no" ${existing.attending === false ? 'selected' : ''}>No</option>
//             </select>
//           </div>

//           <div class="mb-2 dietary ${existing.attending ? '' : 'd-none'}">
//             <label>Dietary requirements</label>
//             <input class="form-control dietary-input"
//                    data-id="${member.id}"
//                    value="${existing.dietary || ''}">
//           </div>
//         </div>
//       `);
//     });
//   }

//   // Toggle dietary field visibility
//   $(document).on('change', '.attending', function () {
//     const card = $(this).closest('.card');
//     card.find('.dietary').toggleClass('d-none', this.value !== 'yes');
//   });

//   // Submit logic
//   $('#rsvp-form').on('submit', async function (e) {
//     e.preventDefault();

//     const responses = [];
//     $('.card').each(function () {
//       const id = $(this).find('.attending').data('id');
//       const attending = $(this).find('.attending').val() === 'yes';
//       const dietary = $(this).find('.dietary-input').val() || '';
//       const plusoneName = $(this).find('.plusone-name').val();

//       responses.push({
//         id,
//         attending,
//         dietary,
//         plusone_name: plusoneName || null
//       });
//     });

//     const { error } = await supabaseClient
//       .from('guests')
//       .update({
//         responses,
//         submitted_at: new Date().toISOString()
//       })
//       .eq('id', currentRow.id);

//     if (error) {
//       $('#password-input > .status-text').text('Error saving RSVP');
//     } else {
//       $('#password-input > .status-text').text('RSVP saved successfully!');
//     }
//   });