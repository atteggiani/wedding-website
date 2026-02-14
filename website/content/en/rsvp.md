---
title: "RSVP"
---

<div id="rsvp-section">
    <div id="page-loader" class="d-none">
        <div class="loader-inner">
        <div class="spinner-border" role="status"></div>
        <p class="mt-3">Loading your invitation…</p>
        </div>
    </div>
    <div id="password-input" class="d-none">
        <label class="form-label">Enter your password:</label>
        <input type="text" id="rsvp-password" class="form-control mb-3" value="FZF5UU">
        <button class="btn btn-primary" id="load-rsvp">Continue</button>
        <div class="status-text"></div>
    </div>
    <form id="rsvp-form" class="d-none">
        <h5>
            Please complete or update the RSVP responses for the following guests:
        </h5>
        <div id="guests-container"></div>
        <button type="submit" class="btn btn-success mt-4" id="submit-rsvp">Submit</button>
        <div class="status-text"></div>
    </form>
</div>
<h5>If you encounter any issues with your invitation, please don't hesitate to contact us!</h5>