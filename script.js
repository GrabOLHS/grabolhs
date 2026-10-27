(() => {
  const form = document.getElementById('course-email-form');
  const urls = document.getElementById('course-urls');
  if (!form || !urls) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const body = urls.value.trim() || 'Please add the following course URL(s):\n\n';
    const subject = encodeURIComponent('Grab OLHS — course addition request');
    const message = encodeURIComponent(body);
    window.location.href = `mailto:grabolhs@yahoo.com?subject=${subject}&body=${message}`;
  });
})();
