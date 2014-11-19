// IE does not support have Document.prototype.contains.
if (typeof document.contains !== 'function') {
  Document.prototype.contains = function(node) {
    if (node === this || node.parentNode === this)
      return true;
    return this.documentElement.contains(node);
 }
}
