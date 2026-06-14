(function() {
  var script = document.currentScript;
  var eventId = script.getAttribute('data-event-id');
  var baseUrl = script.src.replace('/widget/embed.js', '');

  if (!eventId) {
    console.error('EventHub: data-event-id attribute is required');
    return;
  }

  var iframe = document.createElement('iframe');
  iframe.src = baseUrl + '/embed/' + eventId;
  iframe.style.width = '100%';
  iframe.style.minHeight = '500px';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '12px';
  iframe.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
  iframe.setAttribute('title', 'EventHub 购票');

  script.parentNode.insertBefore(iframe, script.nextSibling);

  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'eventhub-resize') {
      iframe.style.height = e.data.height + 'px';
    }
  });
})();
