<div class="container py-5">
  <h1>RSVP</h1>

  <div id="token-form">
    <label class="form-label">Enter your RSVP code</label>
    <input type="text" id="rsvp-token" class="form-control mb-3">
    <button class="btn btn-primary" id="load-rsvp">Continue</button>
  </div>

  <form id="rsvp-form" class="d-none">
    <div id="guests-container"></div>
    <button type="submit" class="btn btn-success mt-4">Submit RSVP</button>
  </form>

  <div id="status" class="mt-3"></div>
</div>

<!-- JavaScript inline -->
<script>
    // Set loading spinner button
    function setLoading(isLoading) {
        const btn = $('#load-rsvp');

        if (isLoading) {
            btn.prop('disabled', true);
            btn.html(`
            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Loading...
            `);
        } else {
            btn.prop('disabled', false);
            btn.text('Continue');
        }
    }

    // Run Supabase Edge function to get a guest session to authenticate the user if the rsvp_token matches
    async function getGuestSession(rsvpToken, supabaseURL, supabaseAnonKey) {
        const res = await fetch(
            `${supabaseURL}/functions/v1/guest-issue-jwt`, 
            { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseAnonKey}`
                },
                body: JSON.stringify({ rsvp_token: rsvpToken })
            }
        );

        if (!res.ok) {
            if (res.status === 401) {
                $('#status').text(
                    "Oops! The RSVP code you entered is invalid. Check the invitation for your code. If you can’t find it, please contact us!"
                );
            } else {
                $('#status').text(
                    "There was an error retriving the RSVP_password! Please try again. If the error persists, please contact us!"
                );
            }
            return
        }

        const { session } = await res.json();
        return session;
    }

    // Authenticate as a guest to supabase after receiving a `session` from the Edge Function
    async function signInWithGuestSession(session, supabaseClient) {
        const accessToken = session?.access_token;
        if (!accessToken) throw new Error('No access token returned');

        // Option A — set session in client (recommended):
        await supabaseClient.auth.setSession({
            access_token: accessToken,
            refresh_token: session.refresh_token, // optional if provided
        });
    }

    // Database initialisation
    const SUPABASE_URL = 'https://bcyxjsqpvkywiuvaskvs.supabase.co'
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjeXhqc3Fwdmt5d2l1dmFza3ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3ODk0MjMsImV4cCI6MjA3OTM2NTQyM30.zLQ9S78OPKE0vXYrqbd3BB2jsvtr9HE6bCHuLY-ecyY'
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    $('#load-rsvp').on('click', async function () {
        const rsvpToken = $('#rsvp-token').val().trim();
        if (!rsvpToken) return;
        $('#status').text("")
        setLoading(true);
        // Get Guest session
        const session = await getGuestSession(rsvpToken, SUPABASE_URL, SUPABASE_ANON_KEY)
        if (session) {
            // Authenticate user using session token
            await signInWithGuestSession(session, supabaseClient)
        } else {
            console.log('Error')
        }
        setLoading(false);
    });


        // // Core logic + dynamic form rendering
        // let currentRow = null;
        
  

    
    
//     const { data, error } = await supabaseClient
//       .from('guests')
//       .select('*')
//       .single()
//       .setHeaders({ 'x-request-token': rsvpToken });
    
//     setLoading(false);
//     console.log(error)
//     console.log(data)
//     if (error) {
//       $('#status').text(
//         "Oops! The RSVP code you entered is invalid. Check the invitation for your code. If you can’t find it, please contact us!"
//       );
//       return;
//     }

//     currentRow = data;
//     $('#token-form').hide();
//     $('#rsvp-form').removeClass('d-none');

//     renderGuests(data.group_members, data.responses || []);
//   });

//   function renderGuests(members, responses) {
//     const container = $('#guests-container');
//     container.empty();

//     members.forEach(member => {
//       const existing = responses.find(r => r.id === member.id) || {};

//       container.append(`
//         <div class="card mb-3 p-3">
//           <h5>${member.name}</h5>

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
//       $('#status').text('Error saving RSVP');
//     } else {
//       $('#status').text('RSVP saved successfully!');
//     }
//   });
</script>
