/* Minimal JS for language dropdown accessibility */
(function(){
  const toggle = document.getElementById('langToggle');
  const list = document.getElementById('langList');
  if (!toggle || !list) return;
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    list.setAttribute('aria-hidden', String(expanded));
  });
  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !list.contains(e.target)) {
      toggle.setAttribute('aria-expanded', 'false');
      list.setAttribute('aria-hidden', 'true');
    }
  });
})();