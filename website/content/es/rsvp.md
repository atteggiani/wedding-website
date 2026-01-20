---
title: "Confirma"
---

<div id="rsvp-section">
    <div id="page-loader" class="d-none">
        <div class="loader-inner">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-3">Cargando la invitación…</p>
        </div>
    </div>
    <div id="password-input" class="d-none">
        <label class="form-label">Introduce tu contraseña:</label>
        <input type="text" id="rsvp-password" class="form-control mb-3" value="FZF5UU">
        <button class="btn btn-primary" id="load-rsvp">Continúa</button>
        <div class="status-text"></div>
    </div>
    <form id="rsvp-form" class="d-none">
        <h5>
            Por favor, completa o actualiza la confirmación de asistencia para los siguientes invitados:
        </h5>
        <div id="guests-container"></div>
        <button type="submit" class="btn btn-success mt-4" id="submit-rsvp">Envia</button>
        <div class="status-text"></div>
    </form>
</div>