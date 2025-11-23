//
// Basic Supabase client (no library needed)
//
const config = document.querySelector("meta[name='hugo:params']").dataset;

const SUPA_URL = config.supabaseUrl;
const SUPA_KEY = config.supabaseAnonKey;

async function supa(url, method = "GET", body = null) {
  return fetch(`${SUPA_URL}/rest/v1/${url}`, {
    method,
    headers: {
      "apikey": SUPA_KEY,
      "Authorization": `Bearer ${SUPA_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    },
    body: body ? JSON.stringify(body) : null
  }).then(r => r.json());
}

//
// Load token from URL
//
const params = new URLSearchParams(window.location.search);
const token = params.get("t");

const container = document.getElementById("rsvp-container");

if (!token) {
  container.innerHTML = "<p>Missing token.</p>";
  throw new Error("No token provided");
}

//
// Fetch guest group
//
async function loadRSVP() {
  const res = await supa(`guests?token=eq.${token}&select=*`);
  if (!res || !res.length) {
    container.innerHTML = "<p>Invalid RSVP link.</p>";
    return;
  }

  const group = res[0];
  renderForm(group);
}

//
// Render dynamic RSVP form
//
function renderForm(group) {
  const members = group.group_members;
  const responses = group.responses || {};
  const custom = group.custom_form || {};

  let html = `<form id="rsvpForm">`;

  html += `<h2>RSVP for your group</h2>`;

  members.forEach(member => {
    const r = responses[member.id] || {};

    html += `
      <div class="guest-block">
        <h3>${member.name}</h3>
        <label>Will attend:
          <select name="attending-${member.id}">
            <option value="yes" ${r.attending === "yes" ? "selected" : ""}>Yes</option>
            <option value="no"  ${r.attending === "no" ? "selected" : ""}>No</option>
          </select>
        </label>

        <label>Meal choice:
          <select name="meal-${member.id}">
            <option value="none">— Select —</option>
            <option value="meat" ${r.meal === "meat" ? "selected" : ""}>Meat</option>
            <option value="fish" ${r.meal === "fish" ? "selected" : ""}>Fish</option>
            <option value="veg"  ${r.meal === "veg"  ? "selected" : ""}>Vegetarian</option>
          </select>
        </label>
      </div>
    `;
  });

  //
  // Example custom section
  //
  if (custom.show_transport_question) {
    html += `
      <label>Would you like a seat on the bus?
        <select name="bus">
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </label>
    `;
  }

  html += `<button type="submit">Save RSVP</button></form>`;

  container.innerHTML = html;

  //
  // Submit handler
  //
  document.getElementById("rsvpForm").addEventListener("submit", async evt => {
    evt.preventDefault();

    const formData = new FormData(evt.target);
    const newResponses = {};

    group.group_members.forEach(m => {
      newResponses[m.id] = {
        attending: formData.get(`attending-${m.id}`),
        meal: formData.get(`meal-${m.id}`)
      };
    });

    await supa(`guests?token=eq.${token}`, "PATCH", {
      responses: newResponses
    });

    alert("RSVP saved!");
  });
}

loadRSVP();
