const COOKIE_JWT='guest_jwt'
const COOKIE_JWT_EXP='guest_jwt_exp'

function restoreGuestSession(client) {
    const jwt = sessionStorage.getItem(COOKIE_JWT);
    const exp = sessionStorage.getItem(COOKIE_JWT_EXP);

    if (!jwt || !exp) return false;

    // Expired?
    if (Date.now() >= Number(exp)) {
        sessionStorage.clear();
        return false;
    }

    setSupabaseClientJWT(client,jwt);
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
            // console.log(res.error);
        }
        return
    }
    return res.data.access_token;
}

const cornerIcons = {
    child: '/assets/child_icon.png',
    plusone: '/assets/plusone.png',
}

function renderCornerIcon(type) {
    return `
    <div class="card-corner-icon" type=${type}>
      <img src="${cornerIcons[type]}" alt="${type}" />
    </div>
  `;
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
        setSupabaseClientJWT(supabaseClient, JWT);
        const { data, error } = await supabaseClient
            .from('guests')
            .select('*')
            .single();
        setLoading(false);
        if (!error) {
            renderGuests(data.group_members, data.responses);
        } else {
            $('#password-input > .status-text').text(
                `There was an error retrieving data associated with guest '${rsvpPassword}'! Please try again. If the error persists, please contact us!`
            );
            // console.log(error);
        }
    }
});

function renderGuests(members, responses) {
    const container = $('#guests-container');
    container.empty();
    members.forEach(member => {
        const name = member.name || '';
        const response = responses?.[member.id]
        const attendance = response?.attendance || false;
        const dietaryRequirements = response?.dietary_requirements || '';
        // Determine what type of member this is
        const hasPlusOne = !!member.plusone;
        const hasChild = !!member.child;
        // Default labels
        let attendanceLabel = 'Are you attending?';
        let showPlusOneNameInput = false;
        let plusOneNameLabel = '';
        // Adjust labels/inputs based on member type
        if (hasPlusOne && hasChild) {
            attendanceLabel = 'Is a child attending?';
            showPlusOneNameInput = true;
            plusOneNameLabel = 'Full name of your child';
        } else if (hasPlusOne) {
            attendanceLabel = 'Is a +1 attending?';
            showPlusOneNameInput = true;
            plusOneNameLabel = 'Full name of your +1';
        } else if (hasChild) {
            attendanceLabel = 'Is this child attending?';
        }
        // Build HTML sections
        const nameSection = !showPlusOneNameInput
            ? `<h4>${name}</h4>` : 
            `<div class="form-floating mb-3">
                <input 
                type="text" 
                maxlength="50"
                class="form-control" 
                id="plusoneName_${member.id}"
                value="${name}"
                ${attendance ? '' : 'disabled'}
                >
                <label for="plusoneName_${member.id}">
                    ${plusOneNameLabel}
                </label>
            </div>`;
        
        const attendanceSection = `
        <div class="d-flex align-items-center gap-3 attending-form mt-2 mb-2">
            <span>${attendanceLabel}</span>
            <div class="form-check form-switch m-0">
                <input
                class="form-check-input"
                type="checkbox"
                id="attending-switch-${member.id}"
                ${attendance ? 'checked' : ''}
                >
                <label class="form-check-label" for="attending-switch-${member.id}" id="attendingLabel_${member.id}">
                    ${attendance ? 'Yes' : 'No'}
                </label>
            </div>
        </div>`;
        
        const dietarySection = `
        <div class="form-floating mb-3">
            <input 
            type="text" 
            maxlength="50"
            class="form-control" 
            id="dietary-requirements-${member.id}"
            value="${dietaryRequirements}"
            ${attendance ? '' : 'disabled'}
            >
            <label for="dietary-requirements-${member.id}">
                Dietary requirements
            </label>
        </div>`;
        // Assemble card depending on the order
        let cardHTML;
        let cornerIconHTML = '';
        if (hasPlusOne) {
            cornerIconHTML = renderCornerIcon(hasChild ? 'child' : 'plusone');
        } else if (hasChild) {
            cornerIconHTML = renderCornerIcon('child');
        }
        if (hasPlusOne) {
            // Attendance first, then name, then dietary
            cardHTML = `
                <div class="card mb-3 p-3">
                    ${cornerIconHTML}
                    ${attendanceSection}
                    ${nameSection}
                    ${dietarySection}
                </div>
            `;
        } else {
            // Name first, then attendance, then dietary
            cardHTML = `
                <div class="card mb-3 p-3">
                    ${cornerIconHTML}
                    ${nameSection}
                    ${attendanceSection}
                    ${dietarySection}
                </div>
            `;
        }
        container.append(cardHTML);
    });
    $('#password-input').addClass('d-none');
    $('#rsvp-form').removeClass('d-none');
};

// Change functionality based on attendance switch
$(document).on('change', 'input[id^="attending-switch-"]', function () {
  const id = this.id.replace('attending-switch-', '');
  const isAttending = this.checked;

  // Update label
  $(`#attendingLabel_${id}`).text(isAttending ? 'Yes' : 'No');

  // Enable / disable 
  const dietaryText = $(`#dietary-requirements-${id}`);
  dietaryText.prop('disabled', !isAttending);
  const nameText = $(`#plusoneName_${id}`);
  nameText.prop('disabled', !isAttending);
});


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

        renderGuests(data.group_members, data.responses);

    } catch (err) {
        clearSupabaseClientJWT(supabaseClient);
        sessionStorage.clear();
        $('#password-input').removeClass('d-none');

    } finally {
        hidePageLoader();
    }
});
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