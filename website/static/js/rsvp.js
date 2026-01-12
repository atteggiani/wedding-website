// =====================
// Constants
// =====================
const COOKIE_JWT = 'guest_jwt';
const COOKIE_JWT_EXP = 'guest_jwt_exp';

const cornerIcons = {
  child: '/assets/child_icon.png',
  plusone: '/assets/plusone.png',
};

// =====================
// Cached DOM
// =====================
const $passwordInput = $('#password-input');
const $rsvpForm = $('#rsvp-form');
const $pageLoader = $('#page-loader');
const $guestsContainer = $('#guests-container');
const $loadRsvpBtn = $('#load-rsvp');
const $submitRsvpBtn = $('#submit-rsvp');
const $passwordStatus = $passwordInput.find('.status-text');
const $submitStatus = $rsvpForm.find('.status-text');

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

function restoreGuestSession(client) {
    const jwt = sessionStorage.getItem(COOKIE_JWT);
    const exp = sessionStorage.getItem(COOKIE_JWT_EXP);

    if (!jwt || !exp) return false;

    // Expired?
    if (Date.now() >= Number(exp)) {
        sessionStorage.clear();
        $passwordStatus.text('Your session expired. Please enter your RSVP password again.');
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

// =====================
// UI helpers
// =====================

// Set loading spinner button
function setLoadingButton(elem, isLoading, text = null) {
    if (!text) text = elem.text();
    if (isLoading) {
        elem.prop('disabled', true);
        elem.html(`
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        ${text}
        `);
    } else {
        elem.prop('disabled', false);
        elem.text(text);
    }
}

function showPageLoader() {
    $passwordInput.addClass('d-none');
    $pageLoader.removeClass('d-none');
}

function hidePageLoader() {
    $pageLoader.addClass('d-none');
}

// =====================
// API helpers
// =====================

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
            $passwordStatus.text(
                "Oops! The RSVP password you entered is invalid. Check the invitation for your code. If you can’t find it, please contact us!"
            );
        } else {
            $passwordStatus.text(
                "There was an error validating the RSVP password! Please try again. If the error persists, please contact us!"
            );
        }
        return
    }
    return res.data.access_token;
}

// =====================
// Rendering helpers
// =====================

function renderCornerIcon(type) {
    if (!cornerIcons[type]) return '';
    return `
    <div class="card-corner-icon" type=${type}>
      <img src="${cornerIcons[type]}" alt="${type}" />
    </div>
  `;
}

function renderGuests(data) {
    guestData = data;
    const {group_members: members, responses} = data;
    const container = $guestsContainer;
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
    $passwordInput.addClass('d-none');
    $rsvpForm.removeClass('d-none');
};

// =====================
// Event handlers
// =====================
// RSVP password entering button
$loadRsvpBtn.on('click', async function () {
    const rsvpPassword = $('#rsvp-password').val().trim();
    if (!rsvpPassword) return;
    $passwordStatus.text('');
    setLoadingButton($loadRsvpBtn, true, "Verifying...");
    // Get Guest JWT
    try {
        const JWT = await getGuestJWT(rsvpPassword, supabaseClient);
        if (JWT) {
            storeGuestJWT(JWT);
            setSupabaseClientJWT(supabaseClient, JWT);
            const { data, error } = await supabaseClient
                .from('guests')
                .select('*')
                .single();
            if (!error) {
                renderGuests(data);
            } else {
                $passwordStatus.text(
                    `There was an error retrieving data associated with guest '${rsvpPassword}'! Please try again. If the error persists, please contact us!`
                );
            }
        }
    } finally {
        setLoadingButton($loadRsvpBtn, false, "Continue");
    }
});

// RSVP submit button
$rsvpForm.on('submit', async function (e) {
    e.preventDefault();
    // Clear previous status message
    $submitStatus.removeClass('success').text('');

    setLoadingButton($submitRsvpBtn, true, "Submitting...");
    const newGuestData = { ...guestData };

    try {
        $guestsContainer.find('.card').each(function () {
            const $card = $(this);
            const $attendingSwitch = $card.find('.form-switch input');
            const memberId = $attendingSwitch.attr('id')?.split('-')[2];
            if (!memberId) throw new Error("Member ID not found");

            // Attendance
            const isAttending = $attendingSwitch.prop('checked');
            // Name
            const $nameInput = $card.find(`#plusoneName_${memberId}`);
            if ($nameInput.length && isAttending) {
                const plusOneName = $nameInput.val().trim();
                if (!plusOneName.length) {
                    $submitStatus.text('The name field cannot be empty.');
                    $nameInput.focus();
                    throw new Error();
                };
            
                // Set Name
                newGuestData.group_members.find(
                    member => member.id === memberId
                ).name = plusOneName;
            }

            
            // Dietary requirements
            const dietaryReq = $card.find(`#dietary-requirements-${memberId}`).val().trim() || '';
            // Set responses
            newGuestData.responses[memberId] = {
                attendance: isAttending,
                dietary_requirements: dietaryReq
            };
        });
        // Make sure no "extra guest" is attending if no "primary guest" is attending
        const primaryGuestIds = newGuestData.group_members.filter(
            member => !('plusone' in member) && !('child' in member)
            ).map(member => member.id)
        const extraGuestIds = newGuestData.group_members.filter(
            member => ('plusone' in member) || ('child' in member)
            ).map(member => member.id)
        const primaryGuestAttendance = primaryGuestIds.map(id => newGuestData.responses[id].attendance);
        const extraGuestAttendance = extraGuestIds.map(id => newGuestData.responses[id].attendance);
        if (primaryGuestAttendance.every(x => !x) && extraGuestAttendance.some(x => x)) {
            $submitStatus.text(
                "Plus-ones and children cannot attend unless a primary guest is also attending."
            );
            throw new Error();
        }
        // Ensure JWT is still valid otherwise reload RSVP password
        if (!restoreGuestSession(supabaseClient)) {
            $passwordInput.removeClass('d-none');
            $rsvpForm.addClass('d-none');
            throw new Error("JWT expired");
        }
        // Update the database
        const { data, error } = await supabaseClient
            .from('guests')
            .update({
                group_members: newGuestData.group_members,
                responses: newGuestData.responses
            }).eq('id', newGuestData.id);

        if (error) {
            $submitStatus.text(
                'There was an error saving your RSVP. Please try again. If the error persists, please contact us!'
            );
            throw new Error(error.message || 'Unknown error');
        }
        // Success: show a confirmation message
        $submitStatus.addClass('success').text('Your RSVP has been saved successfully!');
    } finally {
        setLoadingButton($submitRsvpBtn, false, "Submit");
    }
});

// Change functionality based on attendance switch
$(document).on('change', 'input[id^="attending-switch-"]', function () {
    const id = this.id.replace('attending-switch-', '');
    const isAttending = this.checked;

    // Update label
    $(`#attendingLabel_${id}`).text(isAttending ? 'Yes' : 'No');
    // Enable / disable 
    $(`#dietary-requirements-${id}`).prop('disabled', !isAttending);
    const $nameText = $(`#plusoneName_${id}`);
    if ($nameText.length) $nameText.prop('disabled', !isAttending);
});

// =====================
// Initialise page
// =====================

// Database initialisation
let supabaseClient = createSupabaseClient();
let guestData;

// Restore state or load RSVP password input
$(async function () {
    showPageLoader();
    try {
        if (!restoreGuestSession(supabaseClient)) {
            $passwordInput.removeClass('d-none');
            return;
        }

        const { data, error } = await supabaseClient
            .from('guests')
            .select('*')
            .single();
        
        if (error) {
            throw error;
        }

        renderGuests(data);

    } catch (err) {
        clearSupabaseClientJWT(supabaseClient);
        sessionStorage.clear();
        $passwordInput.removeClass('d-none');

    } finally {
        hidePageLoader();
    }
});