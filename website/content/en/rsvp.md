<div class="container py-5">
  <h1>RSVP</h1>
  
  <div id="rsvp-section">
    <div id="page-loader" class="d-none">
        <div class="loader-inner">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-3">Loading your invitation…</p>
        </div>
    </div>
    <div id="password-input" class="d-none">
        <label class="form-label">Enter your RSVP password</label>
        <input type="text" id="rsvp-password" class="form-control mb-3" value="FZF5UU">
        <button class="btn btn-primary" id="load-rsvp">Continue</button>
        <div class="status-text"></div>
    </div>
    <form id="rsvp-form" class="d-none">
        <h5>
            Please complete or modify this RSVP for the people listed below.<br>
        </h5>
        <div id="guests-container"></div>
        <button type="submit" class="btn btn-success mt-4">Submit RSVP</button>
    </form>
  </div>
</div>