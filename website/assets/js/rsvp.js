/* 
This JS file is used as a template for Hugo to produce language-specific JS scripts using
using the i18n function and keys in i18n/<lang>/<lang>.yaml folder 
*/

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
// Templating helpers
// =====================
/**
 * Interpolates placeholders in a string.
 * 
 * Features:
 * - {} placeholders replaced in order using array
 * - {name} placeholders replaced using object
 * - Escaped placeholders (\{…\}) are left as-is
 * 
 * @param {string} str - The string containing placeholders
 * @param {Array|Object} vars - Array for ordered placeholders or Object for named placeholders
 * @returns {string} - Interpolated string
 */
function interpolateString(str, vars) {
  let index = 0;

  return str.replace(/\\?\{(.*?)\}/g, (match, key) => {
    // If escaped, remove the backslash and keep as-is
    if (match.startsWith('\\')) {
      return `{${key}}`;
    }

    if (Array.isArray(vars)) {
      // Ordered replacement
      return vars[index++] ?? '';
    } else if (typeof vars === 'object' && vars !== null) {
      // Named replacement
      return vars[key.trim()] ?? '';
    } else {
      return '';
    }
  });
}

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
        $passwordStatus.text({{ i18n "rsvp.session_expired" | jsonify }});
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

// Calculate JWT token expiration ETA in minutes
function calcJwtExpirationEtaInMinutes() {
    const exp = sessionStorage.getItem(COOKIE_JWT_EXP);
    const eta = Math.ceil((exp - Date.now())/(1000*60))
    return eta;
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
            $passwordStatus.text({{ i18n "rsvp.invalid_password" | jsonify }});
        } else {
            $passwordStatus.text({{ i18n "rsvp.error_validating_password" | jsonify }});
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
        const memberName = member.name || '';
        const response = responses?.[member.id]
        const attendance = response?.attendance || false;
        const dietaryRequirements = response?.dietary_requirements || '';
        // Determine what type of member this is
        const hasPlusOne = !!member.plusone;
        const hasChild = !!member.child;
        // Default labels
        let attendanceLabel = {{ i18n "rsvp.adult_attending_label" | jsonify }};
        let showPlusOneNameInput = false;
        let plusOneNameLabel = '';
        // Adjust labels/inputs based on member type
        if (hasPlusOne && hasChild) {
            attendanceLabel = {{ i18n "rsvp.plusone_child_attending_label" | jsonify }};
            showPlusOneNameInput = true;
            plusOneNameLabel = {{ i18n "rsvp.child_name_label" | jsonify }};
        } else if (hasPlusOne) {
            attendanceLabel = {{ i18n "rsvp.plusone_attending_label" | jsonify }};
            showPlusOneNameInput = true;
            plusOneNameLabel = {{ i18n "rsvp.plusone_name_label" | jsonify }};
        } else if (hasChild) {
            attendanceLabel = {{ i18n "rsvp.child_attending_label" | jsonify }};
        }
        // Build HTML sections
        const nameSection = !showPlusOneNameInput
            ? `<h4>${memberName}</h4>` : 
            `<div class="form-floating mb-3">
                <input 
                type="text" 
                maxlength="50"
                class="form-control" 
                id="plusoneName_${member.id}"
                value="${memberName}"
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
                    ${attendance ? {{ i18n "rsvp.yes" | jsonify }} : {{ i18n "rsvp.no" | jsonify }}}
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
                {{ i18n "rsvp.dietary_requirements_label" | jsonify }}
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
// Password entering button
$loadRsvpBtn.on('click', async function () {
    const rsvpPassword = $('#rsvp-password').val().trim();
    if (!rsvpPassword) return;
    $passwordStatus.text('');
    setLoadingButton($loadRsvpBtn, true, {{ i18n "rsvp.verifying" | jsonify }});
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
                $passwordStatus.text(interpolateString(
                    {{ i18n "rsvp.error_retrieving_data" | jsonify }},
                    { rsvpPassword }
                ));
            }
        }
    } finally {
        setLoadingButton(
            $loadRsvpBtn, 
            false, 
            {{ i18n "rsvp.continue" | jsonify }}
        );
    }
});

// RSVP submit button
$rsvpForm.on('submit', async function (e) {
    e.preventDefault();
    // Clear previous status message
    $submitStatus.removeClass('success').text('');

    setLoadingButton(
        $submitRsvpBtn, 
        true, 
        {{ i18n "rsvp.submitting" | jsonify }}
    );
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
                    $submitStatus.text({{ i18n "rsvp.error_name_not_empty" | jsonify }});
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
            $submitStatus.text({{ i18n "rsvp.error_no_only_extra_attend" | jsonify }});
            throw new Error();
        }
        // Ensure JWT is still valid otherwise reload password input
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
            if (error?.code === "P0001") {
                const eta = calcJwtExpirationEtaInMinutes();
                const s = eta === 1 ? '' : 's'
                $submitStatus.text(interpolateString(
                    {{ i18n "rsvp.error_update_limit" | jsonify }},
                    { eta, s }
                ));
            } else {
                $submitStatus.text({{ i18n "rsvp.error_submission" | jsonify }});
            }
            throw new Error(error.message || 'Unknown error');
        }
        // Success: show a confirmation message
        $submitStatus.addClass('success').text({{ i18n "rsvp.success_submission" | jsonify }});
    } finally {
        setLoadingButton(
            $submitRsvpBtn, 
            false, 
            {{ i18n "rsvp.submit" | jsonify }}
        );
    }
});

// Change functionality based on attendance switch
$(document).on('change', 'input[id^="attending-switch-"]', function () {
    const id = this.id.replace('attending-switch-', '');
    const isAttending = this.checked;

    // Update label
    $(`#attendingLabel_${id}`).text(isAttending ? {{ i18n "rsvp.yes" | jsonify }} : {{ i18n "rsvp.no" | jsonify }});
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