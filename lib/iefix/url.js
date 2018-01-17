(function (DOMParser) {
  "use strict";

  try {
    if ((new window.URL("../a", "https://example.com/")).href === "https://example.com/a") {
      return;
    }
  } catch (ignore) {}

  var isAbsoluteOrDataURL = /^(?:[a-z]+:)?\/\/|data:/i;

  function resolveUrl(url, base_url) {
    var doc, base, link,
      html = "<!doctype><html><head></head></html>";
 
    if (url && base_url) {
      doc = (new DOMParser()).parseFromString(html, 'text/html');
      base = doc.createElement('base');
      link = doc.createElement('link');
      doc.head.appendChild(base);
      doc.head.appendChild(link);
      base.href = base_url;
      link.href = url;
      return link.href;
    }
    return url;
  }

  function URL(url, base) {
    if (base !== undefined) {
      if (!isAbsoluteOrDataURL.test(base)) {
        throw new TypeError("Failed to construct 'URL': Invalid base URL");
      }
      url = resolveUrl(url, base);
    }
    if (!isAbsoluteOrDataURL.test(url)) {
      throw new TypeError("Failed to construct 'URL': Invalid URL");
    }
    this.href = url;
  }
  URL.prototype.href = "";

  if (window.URL && window.URL.createObjectURL) {
    URL.createObjectURL = window.URL.createObjectURL;
  }
  if (window.URL && window.URL.revokeObjectURL) {
    URL.revokeObjectURL = window.URL.revokeObjectURL;
  }

  window.URL = URL;

}(DOMParser));