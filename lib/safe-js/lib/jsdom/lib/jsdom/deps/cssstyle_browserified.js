define([], function(){
  return  (function(exp,t,n){
        function req(n,i){
            if(!t[n]){
                if(!exp[n]){
                    var s=typeof require =="function" && require;
                    if(!i&&s)return s(n,!0);
                    throw new Error("Cannot find module '"+n+"'")
                }
                var o=t[n]={exports:{}};
                exp[n][0](function(t){
                    var i=exp[n][1][t];
                    return req(i?i:t)
                }, o, o.exports)
            }
            return t[n].exports
        }
        for(var i=0; i<n.length; i++)
            req(n[i]);
        
        var myexps = {};

        for(var i in t) {
            for(var j in t[i].exports){
                myexps[j] = t[i].exports[j]
            }
        };
        
        return myexps;
    })(
        {1:
         [
             function(require,module,exports){
                 var cssstyle = require('cssstyle');
             },
             {"cssstyle":2}]
         ,
         3:[
             function(require,module,exports){
                 // nothing to see here... no file methods for the browser
                 
             },{}
         ],
         4:[
             function(require,module,exports){
                 // shim for using process in browser
                 
                 var process = module.exports = {};
                 
                 process.nextTick = (function () {
                     var canSetImmediate = typeof window !== 'undefined'
                         && window.setImmediate;
                     var canPost = typeof window !== 'undefined'
                         && window.postMessage && window.addEventListener
                     ;

                     if (canSetImmediate) {
                         return function (f) { return window.setImmediate(f) };
                     }

                     if (canPost) {
                         var queue = [];
                         window.addEventListener('message', function (ev) {
                             if (ev.source === window && ev.data === 'process-tick') {
                                 ev.stopPropagation();
                                 if (queue.length > 0) {
                                     var fn = queue.shift();
                                     fn();
                                 }
                             }
                         }, true);

                         return function nextTick(fn) {
                             queue.push(fn);
                             window.postMessage('process-tick', '*');
                         };
                     }

                     return function nextTick(fn) {
                         setTimeout(fn, 0);
                     };
                 })();

                 process.title = 'browser';
                 process.browser = true;
                 process.env = {};
                 process.argv = [];

                 process.binding = function (name) {
                     throw new Error('process.binding is not supported');
                 }

                 // TODO(shtylman)
                 process.cwd = function () { return '/' };
                 process.chdir = function (dir) {
                     throw new Error('process.chdir is not supported');
                 };

             },{}
         ],
         5:[
             function(require,module,exports){
                 (function(process){function filter (xs, fn) {
                     var res = [];
                     for (var i = 0; i < xs.length; i++) {
                         if (fn(xs[i], i, xs)) res.push(xs[i]);
                     }
                     return res;
                 }

                                    // resolves . and .. elements in a path array with directory names there
                                    // must be no slashes, empty elements, or device names (c:\) in the array
                                    // (so also no leading and trailing slashes - it does not distinguish
                                    // relative and absolute paths)
                                    function normalizeArray(parts, allowAboveRoot) {
                                        // if the path tries to go above the root, `up` ends up > 0
                                        var up = 0;
                                        for (var i = parts.length; i >= 0; i--) {
                                            var last = parts[i];
                                            if (last == '.') {
                                                parts.splice(i, 1);
                                            } else if (last === '..') {
                                                parts.splice(i, 1);
                                                up++;
                                            } else if (up) {
                                                parts.splice(i, 1);
                                                up--;
                                            }
                                        }

                                        // if the path is allowed to go above the root, restore leading ..s
                                        if (allowAboveRoot) {
                                            for (; up--; up) {
                                                parts.unshift('..');
                                            }
                                        }

                                        return parts;
                                    }

                                    // Regex to split a filename into [*, dir, basename, ext]
                                    // posix version
                                    var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

                                    // path.resolve([from ...], to)
                                    // posix version
                                    exports.resolve = function() {
                                        var resolvedPath = '',
                                        resolvedAbsolute = false;

                                        for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
                                            var path = (i >= 0)
                                                ? arguments[i]
                                                : process.cwd();

                                            // Skip empty and invalid entries
                                            if (typeof path !== 'string' || !path) {
                                                continue;
                                            }

                                            resolvedPath = path + '/' + resolvedPath;
                                            resolvedAbsolute = path.charAt(0) === '/';
                                        }

                                        // At this point the path should be resolved to a full absolute path, but
                                        // handle relative paths to be safe (might happen when process.cwd() fails)

                                        // Normalize the path
                                        resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
                                            return !!p;
                                        }), !resolvedAbsolute).join('/');

                                        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
                                    };

                                    // path.normalize(path)
                                    // posix version
                                    exports.normalize = function(path) {
                                        var isAbsolute = path.charAt(0) === '/',
                                        trailingSlash = path.slice(-1) === '/';

                                        // Normalize the path
                                        path = normalizeArray(filter(path.split('/'), function(p) {
                                            return !!p;
                                        }), !isAbsolute).join('/');

                                        if (!path && !isAbsolute) {
                                            path = '.';
                                        }
                                        if (path && trailingSlash) {
                                            path += '/';
                                        }
                                        
                                        return (isAbsolute ? '/' : '') + path;
                                    };


                                    // posix version
                                    exports.join = function() {
                                        var paths = Array.prototype.slice.call(arguments, 0);
                                        return exports.normalize(filter(paths, function(p, index) {
                                            return p && typeof p === 'string';
                                        }).join('/'));
                                    };


                                    exports.dirname = function(path) {
                                        var dir = splitPathRe.exec(path)[1] || '';
                                        var isWindows = false;
                                        if (!dir) {
                                            // No dirname
                                            return '.';
                                        } else if (dir.length === 1 ||
                                                   (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
                                            // It is just a slash or a drive letter with a slash
                                            return dir;
                                        } else {
                                            // It is a full dirname, strip trailing slash
                                            return dir.substring(0, dir.length - 1);
                                        }
                                    };


                                    exports.basename = function(path, ext) {
                                        var f = splitPathRe.exec(path)[2] || '';
                                        // TODO: make this comparison case-insensitive on windows?
                                        if (ext && f.substr(-1 * ext.length) === ext) {
                                            f = f.substr(0, f.length - ext.length);
                                        }
                                        return f;
                                    };


                                    exports.extname = function(path) {
                                        return splitPathRe.exec(path)[3] || '';
                                    };

                                    exports.relative = function(from, to) {
                                        from = exports.resolve(from).substr(1);
                                        to = exports.resolve(to).substr(1);

                                        function trim(arr) {
                                            var start = 0;
                                            for (; start < arr.length; start++) {
                                                if (arr[start] !== '') break;
                                            }

                                            var end = arr.length - 1;
                                            for (; end >= 0; end--) {
                                                if (arr[end] !== '') break;
                                            }

                                            if (start > end) return [];
                                            return arr.slice(start, end - start + 1);
                                        }

                                        var fromParts = trim(from.split('/'));
                                        var toParts = trim(to.split('/'));

                                        var length = Math.min(fromParts.length, toParts.length);
                                        var samePartsLength = length;
                                        for (var i = 0; i < length; i++) {
                                            if (fromParts[i] !== toParts[i]) {
                                                samePartsLength = i;
                                                break;
                                            }
                                        }

                                        var outputParts = [];
                                        for (var i = samePartsLength; i < fromParts.length; i++) {
                                            outputParts.push('..');
                                        }

                                        outputParts = outputParts.concat(toParts.slice(samePartsLength));

                                        return outputParts.join('/');
                                    };

                                   })(require("__browserify_process"))
             },{"__browserify_process":4}
         ],
         2:[
             function(require,module,exports){
                 (function(){/*********************************************************************
                              * This is a fork from the CSS Style Declaration part of
                              * https://github.com/NV/CSSOM
                              ********************************************************************/
                     "use strict";
                     /*jslint es5: true*/
                     var CSSOM = require('cssom');
                     var fs = require('fs');
                     var path = require('path');

                     /**
                      * @constructor
                      * @see http://www.w3.org/TR/DOM-Level-2-Style/css.html#CSS-CSSStyleDeclaration
                      */
                     var CSSStyleDeclaration = function CSSStyleDeclaration() {
                         this._values = {};
                         this._importants = {};
                         this._length = 0;
                     };
                     CSSStyleDeclaration.prototype = {
                         constructor: CSSStyleDeclaration,

                         /**
                          *
                          * @param {string} name
                          * @see http://www.w3.org/TR/DOM-Level-2-Style/css.html#CSS-CSSStyleDeclaration-getPropertyValue
                          * @return {string} the value of the property if it has been explicitly set for this declaration block.
                          * Returns the empty string if the property has not been set.
                          */
                         getPropertyValue: function (name) {
                             return this._values[name] || "";
                         },

                         /**
                          *
                          * @param {string} name
                          * @param {string} value
                          * @param {string} [priority=null] "important" or null
                          * @see http://www.w3.org/TR/DOM-Level-2-Style/css.html#CSS-CSSStyleDeclaration-setProperty
                          */
                         setProperty: function (name, value, priority) {
                             if (this._values[name]) {
                                 // Property already exist. Overwrite it.
                                 var index = Array.prototype.indexOf.call(this, name);
                                 if (index < 0) {
                                     this[this._length] = name;
                                     this._length++;
                                 }
                             } else {
                                 // New property.
                                 this[this._length] = name;
                                 this._length++;
                             }
                             this._values[name] = value;
                             this._importants[name] = priority;
                         },

                         /**
                          *
                          * @param {string} name
                          * @see http://www.w3.org/TR/DOM-Level-2-Style/css.html#CSS-CSSStyleDeclaration-removeProperty
                          * @return {string} the value of the property if it has been explicitly set for this declaration block.
                          * Returns the empty string if the property has not been set or the property name does not correspond to a known CSS property.
                          */
                         removeProperty: function (name) {
                             if (!this._values.hasOwnProperty(name)) {
                                 return "";
                             }
                             var index = Array.prototype.indexOf.call(this, name);
                             if (index < 0) {
                                 return "";
                             }
                             var prevValue = this._values[name];
                             delete this._values[name];

                             // That's what WebKit and Opera do
                             Array.prototype.splice.call(this, index, 1);

                             // That's what Firefox does
                             //this[index] = ""

                             return prevValue;
                         },


                         /**
                          *
                          * @param {String} name
                          */
                         getPropertyPriority: function (name) {
                             return this._importants[name] || "";
                         },


                         getPropertyCSSValue: function () {
                             //FIXME
                         },

                         /**
                          *   element.style.overflow = "auto"
                          *   element.style.getPropertyShorthand("overflow-x")
                          *   -> "overflow"
                          */
                         getPropertyShorthand: function () {
                             //FIXME
                         },

                         isPropertyImplicit: function () {
                             //FIXME
                         },

                         /**
                          *   http://www.w3.org/TR/DOM-Level-2-Style/css.html#CSS-CSSStyleDeclaration-item
                          */
                         item: function (index) {
                             index = parseInt(index, 10);
                             if (index < 0 || index >= this._length) {
                                 return '';
                             }
                             return this[index];
                         },

                         get cssText() {
                             var properties = [];
                             var i;
                             for (i = 0; i < this._length; i++) {
                                 var name = this[i];
                                 var value = this.getPropertyValue(name);
                                 var priority = this.getPropertyPriority(name);
                                 if (priority !== '') {
                                     priority = " !" + priority;
                                 }
                                 properties.push([name, ': ', value, priority, ';'].join(''));
                             }
                             return properties.join(' ');
                         },
                         set cssText(value) {
                             var i;
                             this._values = {};
                             Array.prototype.splice.call(this, 0, this._length);
                             this._importants = {};
                             var dummyRule = CSSOM.parse('#bogus{' + value + '}').cssRules[0].style;
                             var rule_length = dummyRule.length;
                             var name;
                             for (i = 0; i < rule_length; ++i) {
                                 name = dummyRule[i];
                                 this.setProperty(dummyRule[i], dummyRule.getPropertyValue(name), dummyRule.getPropertyPriority(name));
                             }
                         },


                         get parentRule() { return null; },

                         get length() { return this._length; },
                         /**
                          * This deletes indices if the new length is less then the current
                          * length. If the new length is more, it does nothing, the new indices
                          * will be undefined until set.
                          **/
                         set length(value) {
                             var i;
                             for (i = value; i < this._length; i++) {
                                 delete this[i];
                             }
                             this._length = value;
                         },

                         // properties
                         get alignmentBaseline() { return this.getPropertyValue('alignment-baseline'); },
                         set alignmentBaseline(v) { this.setProperty('alignment-baseline', v); },
                         get azimuth() { return this.getPropertyValue('azimuth'); },
                         set azimuth(v) { this.setProperty('azimuth', v); },
                         get background() { return this.getPropertyValue('background'); },
                         set background(v) { this.setProperty('background', v); },
                         get backgroundAttachment() { return this.getPropertyValue('background-attachment'); },
                         set backgroundAttachment(v) { this.setProperty('background-attachment', v); },
                         get backgroundClip() { return this.getPropertyValue('background-clip'); },
                         set backgroundClip(v) { this.setProperty('background-clip', v); },
                         get backgroundColor() { return this.getPropertyValue('background-color'); },
                         set backgroundColor(v) { this.setProperty('background-color', v); },
                         get backgroundImage() { return this.getPropertyValue('background-image'); },
                         set backgroundImage(v) { this.setProperty('background-image', v); },
                         get backgroundOrigin() { return this.getPropertyValue('background-origin'); },
                         set backgroundOrigin(v) { this.setProperty('background-origin', v); },
                         get backgroundPosition() { return this.getPropertyValue('background-position'); },
                         set backgroundPosition(v) { this.setProperty('background-position', v); },
                         get backgroundPositionX() { return this.getPropertyValue('background-position-x'); },
                         set backgroundPositionX(v) { this.setProperty('background-position-x', v); },
                         get backgroundPositionY() { return this.getPropertyValue('background-position-y'); },
                         set backgroundPositionY(v) { this.setProperty('background-position-y', v); },
                         get backgroundRepeat() { return this.getPropertyValue('background-repeat'); },
                         set backgroundRepeat(v) { this.setProperty('background-repeat', v); },
                         get backgroundRepeatX() { return this.getPropertyValue('background-repeat-x'); },
                         set backgroundRepeatX(v) { this.setProperty('background-repeat-x', v); },
                         get backgroundRepeatY() { return this.getPropertyValue('background-repeat-y'); },
                         set backgroundRepeatY(v) { this.setProperty('background-repeat-y', v); },
                         get backgroundSize() { return this.getPropertyValue('background-size'); },
                         set backgroundSize(v) { this.setProperty('background-size', v); },
                         get baselineShift() { return this.getPropertyValue('baseline-shift'); },
                         set baselineShift(v) { this.setProperty('baseline-shift', v); },
                         get border() { return this.getPropertyValue('border'); },
                         set border(v) { this.setProperty('border', v); },
                         get borderBottom() { return this.getPropertyValue('border-bottom'); },
                         set borderBottom(v) { this.setProperty('border-bottom', v); },
                         get borderBottomColor() { return this.getPropertyValue('border-bottom-color'); },
                         set borderBottomColor(v) { this.setProperty('border-bottom-color', v); },
                         get borderBottomLeftRadius() { return this.getPropertyValue('border-bottom-left-radius'); },
                         set borderBottomLeftRadius(v) { this.setProperty('border-bottom-left-radius', v); },
                         get borderBottomRightRadius() { return this.getPropertyValue('border-bottom-right-radius'); },
                         set borderBottomRightRadius(v) { this.setProperty('border-bottom-right-radius', v); },
                         get borderBottomStyle() { return this.getPropertyValue('border-bottom-style'); },
                         set borderBottomStyle(v) { this.setProperty('border-bottom-style', v); },
                         get borderBottomWidth() { return this.getPropertyValue('border-bottom-width'); },
                         set borderBottomWidth(v) { this.setProperty('border-bottom-width', v); },
                         get borderCollapse() { return this.getPropertyValue('border-collapse'); },
                         set borderCollapse(v) { this.setProperty('border-collapse', v); },
                         get borderColor() { return this.getPropertyValue('border-color'); },
                         set borderColor(v) { this.setProperty('border-color', v); },
                         get borderImage() { return this.getPropertyValue('border-image'); },
                         set borderImage(v) { this.setProperty('border-image', v); },
                         get borderImageOutset() { return this.getPropertyValue('border-image-outset'); },
                         set borderImageOutset(v) { this.setProperty('border-image-outset', v); },
                         get borderImageRepeat() { return this.getPropertyValue('border-image-repeat'); },
                         set borderImageRepeat(v) { this.setProperty('border-image-repeat', v); },
                         get borderImageSlice() { return this.getPropertyValue('border-image-slice'); },
                         set borderImageSlice(v) { this.setProperty('border-image-slice', v); },
                         get borderImageSource() { return this.getPropertyValue('border-image-source'); },
                         set borderImageSource(v) { this.setProperty('border-image-source', v); },
                         get borderImageWidth() { return this.getPropertyValue('border-image-width'); },
                         set borderImageWidth(v) { this.setProperty('border-image-width', v); },
                         get borderLeft() { return this.getPropertyValue('border-left'); },
                         set borderLeft(v) { this.setProperty('border-left', v); },
                         get borderLeftColor() { return this.getPropertyValue('border-left-color'); },
                         set borderLeftColor(v) { this.setProperty('border-left-color', v); },
                         get borderLeftStyle() { return this.getPropertyValue('border-left-style'); },
                         set borderLeftStyle(v) { this.setProperty('border-left-style', v); },
                         get borderLeftWidth() { return this.getPropertyValue('border-left-width'); },
                         set borderLeftWidth(v) { this.setProperty('border-left-width', v); },
                         get borderRadius() { return this.getPropertyValue('border-radius'); },
                         set borderRadius(v) { this.setProperty('border-radius', v); },
                         get borderRight() { return this.getPropertyValue('border-right'); },
                         set borderRight(v) { this.setProperty('border-right', v); },
                         get borderRightColor() { return this.getPropertyValue('border-right-color'); },
                         set borderRightColor(v) { this.setProperty('border-right-color', v); },
                         get borderRightStyle() { return this.getPropertyValue('border-right-style'); },
                         set borderRightStyle(v) { this.setProperty('border-right-style', v); },
                         get borderRightWidth() { return this.getPropertyValue('border-right-width'); },
                         set borderRightWidth(v) { this.setProperty('border-right-width', v); },
                         get borderSpacing() { return this.getPropertyValue('border-spacing'); },
                         set borderSpacing(v) { this.setProperty('border-spacing', v); },
                         get borderStyle() { return this.getPropertyValue('border-style'); },
                         set borderStyle(v) { this.setProperty('border-style', v); },
                         get borderTop() { return this.getPropertyValue('border-top'); },
                         set borderTop(v) { this.setProperty('border-top', v); },
                         get borderTopColor() { return this.getPropertyValue('border-top-color'); },
                         set borderTopColor(v) { this.setProperty('border-top-color', v); },
                         get borderTopLeftRadius() { return this.getPropertyValue('border-top-left-radius'); },
                         set borderTopLeftRadius(v) { this.setProperty('border-top-left-radius', v); },
                         get borderTopRightRadius() { return this.getPropertyValue('border-top-right-radius'); },
                         set borderTopRightRadius(v) { this.setProperty('border-top-right-radius', v); },
                         get borderTopStyle() { return this.getPropertyValue('border-top-style'); },
                         set borderTopStyle(v) { this.setProperty('border-top-style', v); },
                         get borderTopWidth() { return this.getPropertyValue('border-top-width'); },
                         set borderTopWidth(v) { this.setProperty('border-top-width', v); },
                         get borderWidth() { return this.getPropertyValue('border-width'); },
                         set borderWidth(v) { this.setProperty('border-width', v); },
                         get bottom() { return this.getPropertyValue('bottom'); },
                         set bottom(v) { this.setProperty('bottom', v); },
                         get boxShadow() { return this.getPropertyValue('box-shadow'); },
                         set boxShadow(v) { this.setProperty('box-shadow', v); },
                         get boxSizing() { return this.getPropertyValue('box-sizing'); },
                         set boxSizing(v) { this.setProperty('box-sizing', v); },
                         get captionSide() { return this.getPropertyValue('caption-side'); },
                         set captionSide(v) { this.setProperty('caption-side', v); },
                         get clear() { return this.getPropertyValue('clear'); },
                         set clear(v) { this.setProperty('clear', v); },
                         get clip() { return this.getPropertyValue('clip'); },
                         set clip(v) { this.setProperty('clip', v); },
                         get clipPath() { return this.getPropertyValue('clip-path'); },
                         set clipPath(v) { this.setProperty('clip-path', v); },
                         get clipRule() { return this.getPropertyValue('clip-rule'); },
                         set clipRule(v) { this.setProperty('clip-rule', v); },
                         get color() { return this.getPropertyValue('color'); },
                         set color(v) { this.setProperty('color', v); },
                         get colorInterpolation() { return this.getPropertyValue('color-interpolation'); },
                         set colorInterpolation(v) { this.setProperty('color-interpolation', v); },
                         get colorInterpolationFilters() { return this.getPropertyValue('color-interpolation-filters'); },
                         set colorInterpolationFilters(v) { this.setProperty('color-interpolation-filters', v); },
                         get colorProfile() { return this.getPropertyValue('color-profile'); },
                         set colorProfile(v) { this.setProperty('color-profile', v); },
                         get colorRendering() { return this.getPropertyValue('color-rendering'); },
                         set colorRendering(v) { this.setProperty('color-rendering', v); },
                         get content() { return this.getPropertyValue('content'); },
                         set content(v) { this.setProperty('content', v); },
                         get counterIncrement() { return this.getPropertyValue('counter-increment'); },
                         set counterIncrement(v) { this.setProperty('counter-increment', v); },
                         get counterReset() { return this.getPropertyValue('counter-reset'); },
                         set counterReset(v) { this.setProperty('counter-reset', v); },
                         get cssFloat() { return this.getPropertyValue('float'); },
                         set cssFloat(v) { this.setProperty('float', v); },
                         get cue() { return this.getPropertyValue('cue'); },
                         set cue(v) { this.setProperty('cue', v); },
                         get cueAfter() { return this.getPropertyValue('cue-after'); },
                         set cueAfter(v) { this.setProperty('cue-after', v); },
                         get cueBefore() { return this.getPropertyValue('cue-before'); },
                         set cueBefore(v) { this.setProperty('cue-before', v); },
                         get cursor() { return this.getPropertyValue('cursor'); },
                         set cursor(v) { this.setProperty('cursor', v); },
                         get direction() { return this.getPropertyValue('direction'); },
                         set direction(v) { this.setProperty('direction', v); },
                         get display() { return this.getPropertyValue('display'); },
                         set display(v) { this.setProperty('display', v); },
                         get dominantBaseline() { return this.getPropertyValue('dominant-baseline'); },
                         set dominantBaseline(v) { this.setProperty('dominant-baseline', v); },
                         get elevation() { return this.getPropertyValue('elevation'); },
                         set elevation(v) { this.setProperty('elevation', v); },
                         get emptyCells() { return this.getPropertyValue('empty-cells'); },
                         set emptyCells(v) { this.setProperty('empty-cells', v); },
                         get enableBackground() { return this.getPropertyValue('enable-background'); },
                         set enableBackground(v) { this.setProperty('enable-background', v); },
                         get fill() { return this.getPropertyValue('fill'); },
                         set fill(v) { this.setProperty('fill', v); },
                         get fillOpacity() { return this.getPropertyValue('fill-opacity'); },
                         set fillOpacity(v) { this.setProperty('fill-opacity', v); },
                         get fillRule() { return this.getPropertyValue('fill-rule'); },
                         set fillRule(v) { this.setProperty('fill-rule', v); },
                         get filter() { return this.getPropertyValue('filter'); },
                         set filter(v) { this.setProperty('filter', v); },
                         get floodColor() { return this.getPropertyValue('flood-color'); },
                         set floodColor(v) { this.setProperty('flood-color', v); },
                         get floodOpacity() { return this.getPropertyValue('flood-opacity'); },
                         set floodOpacity(v) { this.setProperty('flood-opacity', v); },
                         get font() { return this.getPropertyValue('font'); },
                         set font(v) { this.setProperty('font', v); },
                         get fontFamily() { return this.getPropertyValue('font-family'); },
                         set fontFamily(v) { this.setProperty('font-family', v); },
                         get fontSize() { return this.getPropertyValue('font-size'); },
                         set fontSize(v) { this.setProperty('font-size', v); },
                         get fontSizeAdjust() { return this.getPropertyValue('font-size-adjust'); },
                         set fontSizeAdjust(v) { this.setProperty('font-size-adjust', v); },
                         get fontStretch() { return this.getPropertyValue('font-stretch'); },
                         set fontStretch(v) { this.setProperty('font-stretch', v); },
                         get fontStyle() { return this.getPropertyValue('font-style'); },
                         set fontStyle(v) { this.setProperty('font-style', v); },
                         get fontVariant() { return this.getPropertyValue('font-variant'); },
                         set fontVariant(v) { this.setProperty('font-variant', v); },
                         get fontWeight() { return this.getPropertyValue('font-weight'); },
                         set fontWeight(v) { this.setProperty('font-weight', v); },
                         get glyphOrientationHorizontal() { return this.getPropertyValue('glyph-orientation-horizontal'); },
                         set glyphOrientationHorizontal(v) { this.setProperty('glyph-orientation-horizontal', v); },
                         get glyphOrientationVertical() { return this.getPropertyValue('glyph-orientation-vertical'); },
                         set glyphOrientationVertical(v) { this.setProperty('glyph-orientation-vertical', v); },
                         get height() { return this.getPropertyValue('height'); },
                         set height(v) { this.setProperty('height', v); },
                         get imageRendering() { return this.getPropertyValue('image-rendering'); },
                         set imageRendering(v) { this.setProperty('image-rendering', v); },
                         get kerning() { return this.getPropertyValue('kerning'); },
                         set kerning(v) { this.setProperty('kerning', v); },
                         get left() { return this.getPropertyValue('left'); },
                         set left(v) { this.setProperty('left', v); },
                         get letterSpacing() { return this.getPropertyValue('letter-spacing'); },
                         set letterSpacing(v) { this.setProperty('letter-spacing', v); },
                         get lightingColor() { return this.getPropertyValue('lighting-color'); },
                         set lightingColor(v) { this.setProperty('lighting-color', v); },
                         get lineHeight() { return this.getPropertyValue('line-height'); },
                         set lineHeight(v) { this.setProperty('line-height', v); },
                         get listStyle() { return this.getPropertyValue('list-style'); },
                         set listStyle(v) { this.setProperty('list-style', v); },
                         get listStyleImage() { return this.getPropertyValue('list-style-image'); },
                         set listStyleImage(v) { this.setProperty('list-style-image', v); },
                         get listStylePosition() { return this.getPropertyValue('list-style-position'); },
                         set listStylePosition(v) { this.setProperty('list-style-position', v); },
                         get listStyleType() { return this.getPropertyValue('list-style-type'); },
                         set listStyleType(v) { this.setProperty('list-style-type', v); },
                         get margin() { return this.getPropertyValue('margin'); },
                         set margin(v) { this.setProperty('margin', v); },
                         get marginBottom() { return this.getPropertyValue('margin-bottom'); },
                         set marginBottom(v) { this.setProperty('margin-bottom', v); },
                         get marginLeft() { return this.getPropertyValue('margin-left'); },
                         set marginLeft(v) { this.setProperty('margin-left', v); },
                         get marginRight() { return this.getPropertyValue('margin-right'); },
                         set marginRight(v) { this.setProperty('margin-right', v); },
                         get marginTop() { return this.getPropertyValue('margin-top'); },
                         set marginTop(v) { this.setProperty('margin-top', v); },
                         get marker() { return this.getPropertyValue('marker'); },
                         set marker(v) { this.setProperty('marker', v); },
                         get markerEnd() { return this.getPropertyValue('marker-end'); },
                         set markerEnd(v) { this.setProperty('marker-end', v); },
                         get markerMid() { return this.getPropertyValue('marker-mid'); },
                         set markerMid(v) { this.setProperty('marker-mid', v); },
                         get markerOffset() { return this.getPropertyValue('marker-offset'); },
                         set markerOffset(v) { this.setProperty('marker-offset', v); },
                         get markerStart() { return this.getPropertyValue('marker-start'); },
                         set markerStart(v) { this.setProperty('marker-start', v); },
                         get marks() { return this.getPropertyValue('marks'); },
                         set marks(v) { this.setProperty('marks', v); },
                         get mask() { return this.getPropertyValue('mask'); },
                         set mask(v) { this.setProperty('mask', v); },
                         get maxHeight() { return this.getPropertyValue('max-height'); },
                         set maxHeight(v) { this.setProperty('max-height', v); },
                         get maxWidth() { return this.getPropertyValue('max-width'); },
                         set maxWidth(v) { this.setProperty('max-width', v); },
                         get minHeight() { return this.getPropertyValue('min-height'); },
                         set minHeight(v) { this.setProperty('min-height', v); },
                         get minWidth() { return this.getPropertyValue('min-width'); },
                         set minWidth(v) { this.setProperty('min-width', v); },
                         get opacity() { return this.getPropertyValue('opacity'); },
                         set opacity(v) { this.setProperty('opacity', v); },
                         get orphans() { return this.getPropertyValue('orphans'); },
                         set orphans(v) { this.setProperty('orphans', v); },
                         get outline() { return this.getPropertyValue('outline'); },
                         set outline(v) { this.setProperty('outline', v); },
                         get outlineColor() { return this.getPropertyValue('outline-color'); },
                         set outlineColor(v) { this.setProperty('outline-color', v); },
                         get outlineOffset() { return this.getPropertyValue('outline-offset'); },
                         set outlineOffset(v) { this.setProperty('outline-offset', v); },
                         get outlineStyle() { return this.getPropertyValue('outline-style'); },
                         set outlineStyle(v) { this.setProperty('outline-style', v); },
                         get outlineWidth() { return this.getPropertyValue('outline-width'); },
                         set outlineWidth(v) { this.setProperty('outline-width', v); },
                         get overflow() { return this.getPropertyValue('overflow'); },
                         set overflow(v) { this.setProperty('overflow', v); },
                         get overflowX() { return this.getPropertyValue('overflow-x'); },
                         set overflowX(v) { this.setProperty('overflow-x', v); },
                         get overflowY() { return this.getPropertyValue('overflow-y'); },
                         set overflowY(v) { this.setProperty('overflow-y', v); },
                         get padding() { return this.getPropertyValue('padding'); },
                         set padding(v) { this.setProperty('padding', v); },
                         get paddingBottom() { return this.getPropertyValue('padding-bottom'); },
                         set paddingBottom(v) { this.setProperty('padding-bottom', v); },
                         get paddingLeft() { return this.getPropertyValue('padding-left'); },
                         set paddingLeft(v) { this.setProperty('padding-left', v); },
                         get paddingRight() { return this.getPropertyValue('padding-right'); },
                         set paddingRight(v) { this.setProperty('padding-right', v); },
                         get paddingTop() { return this.getPropertyValue('padding-top'); },
                         set paddingTop(v) { this.setProperty('padding-top', v); },
                         get page() { return this.getPropertyValue('page'); },
                         set page(v) { this.setProperty('page', v); },
                         get pageBreakAfter() { return this.getPropertyValue('page-break-after'); },
                         set pageBreakAfter(v) { this.setProperty('page-break-after', v); },
                         get pageBreakBefore() { return this.getPropertyValue('page-break-before'); },
                         set pageBreakBefore(v) { this.setProperty('page-break-before', v); },
                         get pageBreakInside() { return this.getPropertyValue('page-break-inside'); },
                         set pageBreakInside(v) { this.setProperty('page-break-inside', v); },
                         get pause() { return this.getPropertyValue('pause'); },
                         set pause(v) { this.setProperty('pause', v); },
                         get pauseAfter() { return this.getPropertyValue('pause-after'); },
                         set pauseAfter(v) { this.setProperty('pause-after', v); },
                         get pauseBefore() { return this.getPropertyValue('pause-before'); },
                         set pauseBefore(v) { this.setProperty('pause-before', v); },
                         get pitch() { return this.getPropertyValue('pitch'); },
                         set pitch(v) { this.setProperty('pitch', v); },
                         get pitchRange() { return this.getPropertyValue('pitch-range'); },
                         set pitchRange(v) { this.setProperty('pitch-range', v); },
                         get playDuring() { return this.getPropertyValue('play-during'); },
                         set playDuring(v) { this.setProperty('play-during', v); },
                         get pointerEvents() { return this.getPropertyValue('pointer-events'); },
                         set pointerEvents(v) { this.setProperty('pointer-events', v); },
                         get position() { return this.getPropertyValue('position'); },
                         set position(v) { this.setProperty('position', v); },
                         get quotes() { return this.getPropertyValue('quotes'); },
                         set quotes(v) { this.setProperty('quotes', v); },
                         get resize() { return this.getPropertyValue('resize'); },
                         set resize(v) { this.setProperty('resize', v); },
                         get richness() { return this.getPropertyValue('richness'); },
                         set richness(v) { this.setProperty('richness', v); },
                         get right() { return this.getPropertyValue('right'); },
                         set right(v) { this.setProperty('right', v); },
                         get shapeRendering() { return this.getPropertyValue('shape-rendering'); },
                         set shapeRendering(v) { this.setProperty('shape-rendering', v); },
                         get size() { return this.getPropertyValue('size'); },
                         set size(v) { this.setProperty('size', v); },
                         get speak() { return this.getPropertyValue('speak'); },
                         set speak(v) { this.setProperty('speak', v); },
                         get speakHeader() { return this.getPropertyValue('speak-header'); },
                         set speakHeader(v) { this.setProperty('speak-header', v); },
                         get speakNumeral() { return this.getPropertyValue('speak-numeral'); },
                         set speakNumeral(v) { this.setProperty('speak-numeral', v); },
                         get speakPunctuation() { return this.getPropertyValue('speak-punctuation'); },
                         set speakPunctuation(v) { this.setProperty('speak-punctuation', v); },
                         get speechRate() { return this.getPropertyValue('speech-rate'); },
                         set speechRate(v) { this.setProperty('speech-rate', v); },
                         get src() { return this.getPropertyValue('src'); },
                         set src(v) { this.setProperty('src', v); },
                         get stopColor() { return this.getPropertyValue('stop-color'); },
                         set stopColor(v) { this.setProperty('stop-color', v); },
                         get stopOpacity() { return this.getPropertyValue('stop-opacity'); },
                         set stopOpacity(v) { this.setProperty('stop-opacity', v); },
                         get stress() { return this.getPropertyValue('stress'); },
                         set stress(v) { this.setProperty('stress', v); },
                         get stroke() { return this.getPropertyValue('stroke'); },
                         set stroke(v) { this.setProperty('stroke', v); },
                         get strokeDasharray() { return this.getPropertyValue('stroke-dasharray'); },
                         set strokeDasharray(v) { this.setProperty('stroke-dasharray', v); },
                         get strokeDashoffset() { return this.getPropertyValue('stroke-dashoffset'); },
                         set strokeDashoffset(v) { this.setProperty('stroke-dashoffset', v); },
                         get strokeLinecap() { return this.getPropertyValue('stroke-linecap'); },
                         set strokeLinecap(v) { this.setProperty('stroke-linecap', v); },
                         get strokeLinejoin() { return this.getPropertyValue('stroke-linejoin'); },
                         set strokeLinejoin(v) { this.setProperty('stroke-linejoin', v); },
                         get strokeMiterlimit() { return this.getPropertyValue('stroke-miterlimit'); },
                         set strokeMiterlimit(v) { this.setProperty('stroke-miterlimit', v); },
                         get strokeOpacity() { return this.getPropertyValue('stroke-opacity'); },
                         set strokeOpacity(v) { this.setProperty('stroke-opacity', v); },
                         get strokeWidth() { return this.getPropertyValue('stroke-width'); },
                         set strokeWidth(v) { this.setProperty('stroke-width', v); },
                         get tableLayout() { return this.getPropertyValue('table-layout'); },
                         set tableLayout(v) { this.setProperty('table-layout', v); },
                         get textAlign() { return this.getPropertyValue('text-align'); },
                         set textAlign(v) { this.setProperty('text-align', v); },
                         get textAnchor() { return this.getPropertyValue('text-anchor'); },
                         set textAnchor(v) { this.setProperty('text-anchor', v); },
                         get textDecoration() { return this.getPropertyValue('text-decoration'); },
                         set textDecoration(v) { this.setProperty('text-decoration', v); },
                         get textIndent() { return this.getPropertyValue('text-indent'); },
                         set textIndent(v) { this.setProperty('text-indent', v); },
                         get textLineThrough() { return this.getPropertyValue('text-line-through'); },
                         set textLineThrough(v) { this.setProperty('text-line-through', v); },
                         get textLineThroughColor() { return this.getPropertyValue('text-line-through-color'); },
                         set textLineThroughColor(v) { this.setProperty('text-line-through-color', v); },
                         get textLineThroughMode() { return this.getPropertyValue('text-line-through-mode'); },
                         set textLineThroughMode(v) { this.setProperty('text-line-through-mode', v); },
                         get textLineThroughStyle() { return this.getPropertyValue('text-line-through-style'); },
                         set textLineThroughStyle(v) { this.setProperty('text-line-through-style', v); },
                         get textLineThroughWidth() { return this.getPropertyValue('text-line-through-width'); },
                         set textLineThroughWidth(v) { this.setProperty('text-line-through-width', v); },
                         get textOverflow() { return this.getPropertyValue('text-overflow'); },
                         set textOverflow(v) { this.setProperty('text-overflow', v); },
                         get textOverline() { return this.getPropertyValue('text-overline'); },
                         set textOverline(v) { this.setProperty('text-overline', v); },
                         get textOverlineColor() { return this.getPropertyValue('text-overline-color'); },
                         set textOverlineColor(v) { this.setProperty('text-overline-color', v); },
                         get textOverlineMode() { return this.getPropertyValue('text-overline-mode'); },
                         set textOverlineMode(v) { this.setProperty('text-overline-mode', v); },
                         get textOverlineStyle() { return this.getPropertyValue('text-overline-style'); },
                         set textOverlineStyle(v) { this.setProperty('text-overline-style', v); },
                         get textOverlineWidth() { return this.getPropertyValue('text-overline-width'); },
                         set textOverlineWidth(v) { this.setProperty('text-overline-width', v); },
                         get textRendering() { return this.getPropertyValue('text-rendering'); },
                         set textRendering(v) { this.setProperty('text-rendering', v); },
                         get textShadow() { return this.getPropertyValue('text-shadow'); },
                         set textShadow(v) { this.setProperty('text-shadow', v); },
                         get textTransform() { return this.getPropertyValue('text-transform'); },
                         set textTransform(v) { this.setProperty('text-transform', v); },
                         get textUnderline() { return this.getPropertyValue('text-underline'); },
                         set textUnderline(v) { this.setProperty('text-underline', v); },
                         get textUnderlineColor() { return this.getPropertyValue('text-underline-color'); },
                         set textUnderlineColor(v) { this.setProperty('text-underline-color', v); },
                         get textUnderlineMode() { return this.getPropertyValue('text-underline-mode'); },
                         set textUnderlineMode(v) { this.setProperty('text-underline-mode', v); },
                         get textUnderlineStyle() { return this.getPropertyValue('text-underline-style'); },
                         set textUnderlineStyle(v) { this.setProperty('text-underline-style', v); },
                         get textUnderlineWidth() { return this.getPropertyValue('text-underline-width'); },
                         set textUnderlineWidth(v) { this.setProperty('text-underline-width', v); },
                         get top() { return this.getPropertyValue('top'); },
                         set top(v) { this.setProperty('top', v); },
                         get unicodeBidi() { return this.getPropertyValue('unicode-bidi'); },
                         set unicodeBidi(v) { this.setProperty('unicode-bidi', v); },
                         get unicodeRange() { return this.getPropertyValue('unicode-range'); },
                         set unicodeRange(v) { this.setProperty('unicode-range', v); },
                         get vectorEffect() { return this.getPropertyValue('vector-effect'); },
                         set vectorEffect(v) { this.setProperty('vector-effect', v); },
                         get verticalAlign() { return this.getPropertyValue('vertical-align'); },
                         set verticalAlign(v) { this.setProperty('vertical-align', v); },
                         get visibility() { return this.getPropertyValue('visibility'); },
                         set visibility(v) { this.setProperty('visibility', v); },
                         get voiceFamily() { return this.getPropertyValue('voice-family'); },
                         set voiceFamily(v) { this.setProperty('voic-family', v); },
                         get volume() { return this.getPropertyValue('volume'); },
                         set volume(v) { this.setProperty('volume', v); },
                         get webkitAnimation() { return this.getPropertyValue('-webkit-animation'); },
                         set webkitAnimation(v) { this.setProperty('-webkit-animation', v); },
                         get webkitAnimationDelay() { return this.getPropertyValue('-webkit-animation-delay'); },
                         set webkitAnimationDelay(v) { this.setProperty('-webkit-animation-delay', v); },
                         get webkitAnimationDirection() { return this.getPropertyValue('-webkit-animation-direction'); },
                         set webkitAnimationDirection(v) { this.setProperty('-webkit-animation-direction', v); },
                         get webkitAnimationDuration() { return this.getPropertyValue('-webkit-animation-duration'); },
                         set webkitAnimationDuration(v) { this.setProperty('-webkit-animation-duration', v); },
                         get webkitAnimationFillMode() { return this.getPropertyValue('-webkit-animation-fill-mode'); },
                         set webkitAnimationFillMode(v) { this.setProperty('-webkit-animation-fill-mode', v); },
                         get webkitAnimationIterationCount() { return this.getPropertyValue('-webkit-animation-iteration-count'); },
                         set webkitAnimationIterationCount(v) { this.setProperty('-webkit-animation-iteration-count', v); },
                         get webkitAnimationName() { return this.getPropertyValue('-webkit-animation-name'); },
                         set webkitAnimationName(v) { this.setProperty('-webkit-animation-name', v); },
                         get webkitAnimationPlayState() { return this.getPropertyValue('-webkit-animation-play-state'); },
                         set webkitAnimationPlayState(v) { this.setProperty('-webkit-animation-play-state', v); },
                         get webkitAnimationTimingFunction() { return this.getPropertyValue('-webkit-animation-timing-function'); },
                         set webkitAnimationTimingFunction(v) { this.setProperty('-webkit-animation-timing-function', v); },
                         get webkitAppearance() { return this.getPropertyValue('-webkit-appearance'); },
                         set webkitAppearance(v) { this.setProperty('-webkit-appearance', v); },
                         get webkitAspectRatio() { return this.getPropertyValue('-webkit-aspect-ratio'); },
                         set webkitAspectRatio(v) { this.setProperty('-webkit-aspect-ratio', v); },
                         get webkitBackfaceVisibility() { return this.getPropertyValue('-webkit-backface-visibility'); },
                         set webkitBackfaceVisibility(v) { this.setProperty('-webkit-backface-visibility', v); },
                         get webkitBackgroundClip() { return this.getPropertyValue('-webkit-background-clip'); },
                         set webkitBackgroundClip(v) { this.setProperty('-webkit-background-clip', v); },
                         get webkitBackgroundComposite() { return this.getPropertyValue('-webkit-background-composite'); },
                         set webkitBackgroundComposite(v) { this.setProperty('-webkit-background-composite', v); },
                         get webkitBackgroundOrigin() { return this.getPropertyValue('-webkit-background-origin'); },
                         set webkitBackgroundOrigin(v) { this.setProperty('-webkit-background-origin', v); },
                         get webkitBackgroundSize() { return this.getPropertyValue('-webkit-background-size'); },
                         set webkitBackgroundSize(v) { this.setProperty('-webkit-background-size', v); },
                         get webkitBorderAfter() { return this.getPropertyValue('-webkit-border-after'); },
                         set webkitBorderAfter(v) { this.setProperty('-webkit-border-after', v); },
                         get webkitBorderAfterColor() { return this.getPropertyValue('-webkit-border-after-color'); },
                         set webkitBorderAfterColor(v) { this.setProperty('-webkit-border-after-color', v); },
                         get webkitBorderAfterStyle() { return this.getPropertyValue('-webkit-border-after-style'); },
                         set webkitBorderAfterStyle(v) { this.setProperty('-webkit-border-after-style', v); },
                         get webkitBorderAfterWidth() { return this.getPropertyValue('-webkit-border-after-width'); },
                         set webkitBorderAfterWidth(v) { this.setProperty('-webkit-border-after-width', v); },
                         get webkitBorderBefore() { return this.getPropertyValue('-webkit-border-before'); },
                         set webkitBorderBefore(v) { this.setProperty('-webkit-border-before', v); },
                         get webkitBorderBeforeColor() { return this.getPropertyValue('-webkit-border-before-color'); },
                         set webkitBorderBeforeColor(v) { this.setProperty('-webkit-border-before-color', v); },
                         get webkitBorderBeforeStyle() { return this.getPropertyValue('-webkit-border-before-style'); },
                         set webkitBorderBeforeStyle(v) { this.setProperty('-webkit-border-before-style', v); },
                         get webkitBorderBeforeWidth() { return this.getPropertyValue('-webkit-border-before-width'); },
                         set webkitBorderBeforeWidth(v) { this.setProperty('-webkit-border-before-width', v); },
                         get webkitBorderEnd() { return this.getPropertyValue('-webkit-border-end'); },
                         set webkitBorderEnd(v) { this.setProperty('-webkit-border-end', v); },
                         get webkitBorderEndColor() { return this.getPropertyValue('-webkit-border-end-color'); },
                         set webkitBorderEndColor(v) { this.setProperty('-webkit-border-end-color', v); },
                         get webkitBorderEndStyle() { return this.getPropertyValue('-webkit-border-end-style'); },
                         set webkitBorderEndStyle(v) { this.setProperty('-webkit-border-end-style', v); },
                         get webkitBorderEndWidth() { return this.getPropertyValue('-webkit-border-end-width'); },
                         set webkitBorderEndWidth(v) { this.setProperty('-webkit-border-end-width', v); },
                         get webkitBorderFit() { return this.getPropertyValue('-webkit-border-fit'); },
                         set webkitBorderFit(v) { this.setProperty('-webkit-border-fit', v); },
                         get webkitBorderHorizontalSpacing() { return this.getPropertyValue('-webkit-border-horizontal-spacing'); },
                         set webkitBorderHorizontalSpacing(v) { this.setProperty('-webkit-border-horizontal-spacing', v); },
                         get webkitBorderImage() { return this.getPropertyValue('-webkit-border-image'); },
                         set webkitBorderImage(v) { this.setProperty('-webkit-border-image', v); },
                         get webkitBorderRadius() { return this.getPropertyValue('-webkit-border-radius'); },
                         set webkitBorderRadius(v) { this.setProperty('-webkit-border-radius', v); },
                         get webkitBorderStart() { return this.getPropertyValue('-webkit-border-start'); },
                         set webkitBorderStart(v) { this.setProperty('-webkit-border-start', v); },
                         get webkitBorderStartColor() { return this.getPropertyValue('-webkit-border-start-color'); },
                         set webkitBorderStartColor(v) { this.setProperty('-webkit-border-start-color', v); },
                         get webkitBorderStartStyle() { return this.getPropertyValue('-webkit-border-start-style'); },
                         set webkitBorderStartStyle(v) { this.setProperty('-webkit-border-start-style', v); },
                         get webkitBorderStartWidth() { return this.getPropertyValue('-webkit-border-start-width'); },
                         set webkitBorderStartWidth(v) { this.setProperty('-webkit-border-start-width', v); },
                         get webkitBorderVerticalSpacing() { return this.getPropertyValue('-webkit-border-vertical-spacing'); },
                         set webkitBorderVerticalSpacing(v) { this.setProperty('-webkit-border-vertical-spacing', v); },
                         get webkitBoxAlign() { return this.getPropertyValue('-webkit-box-align'); },
                         set webkitBoxAlign(v) { this.setProperty('-webkit-box-align', v); },
                         get webkitBoxDirection() { return this.getPropertyValue('-webkit-box-direction'); },
                         set webkitBoxDirection(v) { this.setProperty('-webkit-box-direction', v); },
                         get webkitBoxFlex() { return this.getPropertyValue('-webkit-box-flex'); },
                         set webkitBoxFlex(v) { this.setProperty('-webkit-box-flex', v); },
                         get webkitBoxFlexGroup() { return this.getPropertyValue('-webkit-box-flex-group'); },
                         set webkitBoxFlexGroup(v) { this.setProperty('-webkit-box-flex-group', v); },
                         get webkitBoxLines() { return this.getPropertyValue('-webkit-box-lines'); },
                         set webkitBoxLines(v) { this.setProperty('-webkit-box-lines', v); },
                         get webkitBoxOrdinalGroup() { return this.getPropertyValue('-webkit-box-ordinal-group'); },
                         set webkitBoxOrdinalGroup(v) { this.setProperty('-webkit-box-ordinal-group', v); },
                         get webkitBoxOrient() { return this.getPropertyValue('-webkit-box-orient'); },
                         set webkitBoxOrient(v) { this.setProperty('-webkit-box-orient', v); },
                         get webkitBoxPack() { return this.getPropertyValue('-webkit-box-pack'); },
                         set webkitBoxPack(v) { this.setProperty('-webkit-box-pack', v); },
                         get webkitBoxReflect() { return this.getPropertyValue('-webkit-box-reflect'); },
                         set webkitBoxReflect(v) { this.setProperty('-webkit-box-reflect', v); },
                         get webkitBoxShadow() { return this.getPropertyValue('-webkit-box-shadow'); },
                         set webkitBoxShadow(v) { this.setProperty('-webkit-box-shadow', v); },
                         get webkitColorCorrection() { return this.getPropertyValue('-webkit-color-correction'); },
                         set webkitColorCorrection(v) { this.setProperty('-webkit-color-correction', v); },
                         get webkitColumnAxis() { return this.getPropertyValue('-webkit-column-axis'); },
                         set webkitColumnAxis(v) { this.setProperty('-webkit-column-axis', v); },
                         get webkitColumnBreakAfter() { return this.getPropertyValue('-webkit-column-break-after'); },
                         set webkitColumnBreakAfter(v) { this.setProperty('-webkit-column-break-after', v); },
                         get webkitColumnBreakBefore() { return this.getPropertyValue('-webkit-column-break-before'); },
                         set webkitColumnBreakBefore(v) { this.setProperty('-webkit-column-break-before', v); },
                         get webkitColumnBreakInside() { return this.getPropertyValue('-webkit-column-break-inside'); },
                         set webkitColumnBreakInside(v) { this.setProperty('-webkit-column-break-inside', v); },
                         get webkitColumnCount() { return this.getPropertyValue('-webkit-column-count'); },
                         set webkitColumnCount(v) { this.setProperty('-webkit-column-count', v); },
                         get webkitColumnGap() { return this.getPropertyValue('-webkit-column-gap'); },
                         set webkitColumnGap(v) { this.setProperty('-webkit-column-gap', v); },
                         get webkitColumnRule() { return this.getPropertyValue('-webkit-column-rule'); },
                         set webkitColumnRule(v) { this.setProperty('-webkit-column-rule', v); },
                         get webkitColumnRuleColor() { return this.getPropertyValue('-webkit-column-rule-color'); },
                         set webkitColumnRuleColor(v) { this.setProperty('-webkit-column-rule-color', v); },
                         get webkitColumnRuleStyle() { return this.getPropertyValue('-webkit-column-rule-style'); },
                         set webkitColumnRuleStyle(v) { this.setProperty('-webkit-column-rule-style', v); },
                         get webkitColumnRuleWidth() { return this.getPropertyValue('-webkit-column-rule-width'); },
                         set webkitColumnRuleWidth(v) { this.setProperty('-webkit-column-rule-width', v); },
                         get webkitColumnSpan() { return this.getPropertyValue('-webkit-column-span'); },
                         set webkitColumnSpan(v) { this.setProperty('-webkit-column-span', v); },
                         get webkitColumnWidth() { return this.getPropertyValue('-webkit-column-width'); },
                         set webkitColumnWidth(v) { this.setProperty('-webkit-column-width', v); },
                         get webkitColumns() { return this.getPropertyValue('-webkit-columns'); },
                         set webkitColumns(v) { this.setProperty('-webkit-columns', v); },
                         get webkitFilter() { return this.getPropertyValue('-webkit-filter'); },
                         set webkitFilter(v) { this.setProperty('-webkit-filter', v); },
                         get webkitFlexAlign() { return this.getPropertyValue('-webkit-flex-align'); },
                         set webkitFlexAlign(v) { this.setProperty('-webkit-flex-align', v); },
                         get webkitFlexDirection() { return this.getPropertyValue('-webkit-flex-direction'); },
                         set webkitFlexDirection(v) { this.setProperty('-webkit-flex-direction', v); },
                         get webkitFlexFlow() { return this.getPropertyValue('-webkit-flex-flow'); },
                         set webkitFlexFlow(v) { this.setProperty('-webkit-flex-flow', v); },
                         get webkitFlexItemAlign() { return this.getPropertyValue('-webkit-flex-item-align'); },
                         set webkitFlexItemAlign(v) { this.setProperty('-webkit-flex-item-align', v); },
                         get webkitFlexLinePack() { return this.getPropertyValue('-webkit-flex-line-pack'); },
                         set webkitFlexLinePack(v) { this.setProperty('-webkit-flex-line-pack', v); },
                         get webkitFlexOrder() { return this.getPropertyValue('-webkit-flex-order'); },
                         set webkitFlexOrder(v) { this.setProperty('-webkit-flex-order', v); },
                         get webkitFlexPack() { return this.getPropertyValue('-webkit-flex-pack'); },
                         set webkitFlexPack(v) { this.setProperty('-webkit-flex-pack', v); },
                         get webkitFlexWrap() { return this.getPropertyValue('-webkit-flex-wrap'); },
                         set webkitFlexWrap(v) { this.setProperty('-webkit-flex-wrap', v); },
                         get webkitFlowFrom() { return this.getPropertyValue('-webkit-flow-from'); },
                         set webkitFlowFrom(v) { this.setProperty('-webkit-flow-from', v); },
                         get webkitFlowInto() { return this.getPropertyValue('-webkit-flow-into'); },
                         set webkitFlowInto(v) { this.setProperty('-webkit-flow-into', v); },
                         get webkitFontFeatureSettings() { return this.getPropertyValue('-webkit-font-feature-settings'); },
                         set webkitFontFeatureSettings(v) { this.setProperty('-webkit-font-feature-settings', v); },
                         get webkitFontKerning() { return this.getPropertyValue('-webkit-font-kerning'); },
                         set webkitFontKerning(v) { this.setProperty('-webkit-font-kerning', v); },
                         get webkitFontSizeDelta() { return this.getPropertyValue('-webkit-font-size-delta'); },
                         set webkitFontSizeDelta(v) { this.setProperty('-webkit-font-size-delta', v); },
                         get webkitFontSmoothing() { return this.getPropertyValue('-webkit-font-smoothing'); },
                         set webkitFontSmoothing(v) { this.setProperty('-webkit-font-smoothing', v); },
                         get webkitFontVariantLigatures() { return this.getPropertyValue('-webkit-font-variant-ligatures'); },
                         set webkitFontVariantLigatures(v) { this.setProperty('-webkit-font-variant-ligatures', v); },
                         get webkitHighlight() { return this.getPropertyValue('-webkit-highlight'); },
                         set webkitHighlight(v) { this.setProperty('-webkit-highlight', v); },
                         get webkitHyphenateCharacter() { return this.getPropertyValue('-webkit-hyphenate-character'); },
                         set webkitHyphenateCharacter(v) { this.setProperty('-webkit-hyphenate-character', v); },
                         get webkitHyphenateLimitAfter() { return this.getPropertyValue('-webkit-hyphenate-limit-after'); },
                         set webkitHyphenateLimitAfter(v) { this.setProperty('-webkit-hyphenate-limit-after', v); },
                         get webkitHyphenateLimitBefore() { return this.getPropertyValue('-webkit-hyphenate-limit-before'); },
                         set webkitHyphenateLimitBefore(v) { this.setProperty('-webkit-hyphenate-limit-before', v); },
                         get webkitHyphenateLimitLines() { return this.getPropertyValue('-webkit-hyphenate-limit-lines'); },
                         set webkitHyphenateLimitLines(v) { this.setProperty('-webkit-hyphenate-limit-lines', v); },
                         get webkitHyphens() { return this.getPropertyValue('-webkit-hyphens'); },
                         set webkitHyphens(v) { this.setProperty('-webkit-hyphens', v); },
                         get webkitLineAlign() { return this.getPropertyValue('-webkit-line-align'); },
                         set webkitLineAlign(v) { this.setProperty('-webkit-line-align', v); },
                         get webkitLineBoxContain() { return this.getPropertyValue('-webkit-line-box-contain'); },
                         set webkitLineBoxContain(v) { this.setProperty('-webkit-line-box-contain', v); },
                         get webkitLineBreak() { return this.getPropertyValue('-webkit-line-break'); },
                         set webkitLineBreak(v) { this.setProperty('-webkit-line-break', v); },
                         get webkitLineClamp() { return this.getPropertyValue('-webkit-line-clamp'); },
                         set webkitLineClamp(v) { this.setProperty('-webkit-line-clamp', v); },
                         get webkitLineGrid() { return this.getPropertyValue('-webkit-line-grid'); },
                         set webkitLineGrid(v) { this.setProperty('-webkit-line-grid', v); },
                         get webkitLineSnap() { return this.getPropertyValue('-webkit-line-snap'); },
                         set webkitLineSnap(v) { this.setProperty('-webkit-line-snap', v); },
                         get webkitLocale() { return this.getPropertyValue('-webkit-locale'); },
                         set webkitLocale(v) { this.setProperty('-webkit-locale', v); },
                         get webkitLogicalHeight() { return this.getPropertyValue('-webkit-logical-height'); },
                         set webkitLogicalHeight(v) { this.setProperty('-webkit-logical-height', v); },
                         get webkitLogicalWidth() { return this.getPropertyValue('-webkit-logical-width'); },
                         set webkitLogicalWidth(v) { this.setProperty('-webkit-logical-width', v); },
                         get webkitMarginAfter() { return this.getPropertyValue('-webkit-margin-after'); },
                         set webkitMarginAfter(v) { this.setProperty('-webkit-margin-after', v); },
                         get webkitMarginAfterCollapse() { return this.getPropertyValue('-webkit-margin-after-collapse'); },
                         set webkitMarginAfterCollapse(v) { this.setProperty('-webkit-margin-after-collapse', v); },
                         get webkitMarginBefore() { return this.getPropertyValue('-webkit-margin-before'); },
                         set webkitMarginBefore(v) { this.setProperty('-webkit-margin-before', v); },
                         get webkitMarginBeforeCollapse() { return this.getPropertyValue('-webkit-margin-before-collapse'); },
                         set webkitMarginBeforeCollapse(v) { this.setProperty('-webkit-margin-before-collapse', v); },
                         get webkitMarginBottomCollapse() { return this.getPropertyValue('-webkit-margin-bottom-collapse'); },
                         set webkitMarginBottomCollapse(v) { this.setProperty('-webkit-margin-bottom-collapse', v); },
                         get webkitMarginCollapse() { return this.getPropertyValue('-webkit-margin-collapse'); },
                         set webkitMarginCollapse(v) { this.setProperty('-webkit-margin-collapse', v); },
                         get webkitMarginEnd() { return this.getPropertyValue('-webkit-margin-end'); },
                         set webkitMarginEnd(v) { this.setProperty('-webkit-margin-end', v); },
                         get webkitMarginStart() { return this.getPropertyValue('-webkit-margin-start'); },
                         set webkitMarginStart(v) { this.setProperty('-webkit-margin-start', v); },
                         get webkitMarginTopCollapse() { return this.getPropertyValue('-webkit-margin-top-collapse'); },
                         set webkitMarginTopCollapse(v) { this.setProperty('-webkit-margin-top-collapse', v); },
                         get webkitMarquee() { return this.getPropertyValue('-webkit-marquee'); },
                         set webkitMarquee(v) { this.setProperty('-webkit-marquee', v); },
                         get webkitMarqueeDirection() { return this.getPropertyValue('-webkit-marquee-direction'); },
                         set webkitMarqueeDirection(v) { this.setProperty('-webkit-marquee-direction', v); },
                         get webkitMarqueeIncrement() { return this.getPropertyValue('-webkit-marquee-increment'); },
                         set webkitMarqueeIncrement(v) { this.setProperty('-webkit-marquee-increment', v); },
                         get webkitMarqueeRepetition() { return this.getPropertyValue('-webkit-marquee-repetition'); },
                         set webkitMarqueeRepetition(v) { this.setProperty('-webkit-marquee-repetition', v); },
                         get webkitMarqueeSpeed() { return this.getPropertyValue('-webkit-marquee-speed'); },
                         set webkitMarqueeSpeed(v) { this.setProperty('-webkit-marquee-speed', v); },
                         get webkitMarqueeStyle() { return this.getPropertyValue('-webkit-marquee-style'); },
                         set webkitMarqueeStyle(v) { this.setProperty('-webkit-marquee-style', v); },
                         get webkitMask() { return this.getPropertyValue('-webkit-mask'); },
                         set webkitMask(v) { this.setProperty('-webkit-mask', v); },
                         get webkitMaskAttachment() { return this.getPropertyValue('-webkit-mask-attachment'); },
                         set webkitMaskAttachment(v) { this.setProperty('-webkit-mask-attachment', v); },
                         get webkitMaskBoxImage() { return this.getPropertyValue('-webkit-mask-box-image'); },
                         set webkitMaskBoxImage(v) { this.setProperty('-webkit-mask-box-image', v); },
                         get webkitMaskBoxImageOutset() { return this.getPropertyValue('-webkit-mask-box-image-outset'); },
                         set webkitMaskBoxImageOutset(v) { this.setProperty('-webkit-mask-box-image-outset', v); },
                         get webkitMaskBoxImageRepeat() { return this.getPropertyValue('-webkit-mask-box-image-repeat'); },
                         set webkitMaskBoxImageRepeat(v) { this.setProperty('-webkit-mask-box-image-repeat', v); },
                         get webkitMaskBoxImageSlice() { return this.getPropertyValue('-webkit-mask-box-image-slice'); },
                         set webkitMaskBoxImageSlice(v) { this.setProperty('-webkit-mask-box-image-slice', v); },
                         get webkitMaskBoxImageSource() { return this.getPropertyValue('-webkit-mask-box-image-source'); },
                         set webkitMaskBoxImageSource(v) { this.setProperty('-webkit-mask-box-image-source', v); },
                         get webkitMaskBoxImageWidth() { return this.getPropertyValue('-webkit-mask-box-image-width'); },
                         set webkitMaskBoxImageWidth(v) { this.setProperty('-webkit-mask-box-image-width', v); },
                         get webkitMaskClip() { return this.getPropertyValue('-webkit-mask-clip'); },
                         set webkitMaskClip(v) { this.setProperty('-webkit-mask-clip', v); },
                         get webkitMaskComposite() { return this.getPropertyValue('-webkit-mask-composite'); },
                         set webkitMaskComposite(v) { this.setProperty('-webkit-mask-composite', v); },
                         get webkitMaskImage() { return this.getPropertyValue('-webkit-mask-image'); },
                         set webkitMaskImage(v) { this.setProperty('-webkit-mask-image', v); },
                         get webkitMaskOrigin() { return this.getPropertyValue('-webkit-mask-origin'); },
                         set webkitMaskOrigin(v) { this.setProperty('-webkit-mask-origin', v); },
                         get webkitMaskPosition() { return this.getPropertyValue('-webkit-mask-position'); },
                         set webkitMaskPosition(v) { this.setProperty('-webkit-mask-position', v); },
                         get webkitMaskPositionX() { return this.getPropertyValue('-webkit-mask-position-x'); },
                         set webkitMaskPositionX(v) { this.setProperty('-webkit-mask-position-x', v); },
                         get webkitMaskPositionY() { return this.getPropertyValue('-webkit-mask-position-y'); },
                         set webkitMaskPositionY(v) { this.setProperty('-webkit-mask-position-y', v); },
                         get webkitMaskRepeat() { return this.getPropertyValue('-webkit-mask-repeat'); },
                         set webkitMaskRepeat(v) { this.setProperty('-webkit-mask-repeat', v); },
                         get webkitMaskRepeatX() { return this.getPropertyValue('-webkit-mask-repeat-x'); },
                         set webkitMaskRepeatX(v) { this.setProperty('-webkit-mask-repeat-x', v); },
                         get webkitMaskRepeatY() { return this.getPropertyValue('-webkit-mask-repeat-y'); },
                         set webkitMaskRepeatY(v) { this.setProperty('-webkit-mask-repeat-y', v); },
                         get webkitMaskSize() { return this.getPropertyValue('-webkit-mask-size'); },
                         set webkitMaskSize(v) { this.setProperty('-webkit-mask-size', v); },
                         get webkitMatchNearestMailBlockquoteColor() { return this.getPropertyValue('-webkit-match-nearest-mail-blockquote-color'); },
                         set webkitMatchNearestMailBlockquoteColor(v) { this.setProperty('-webkit-match-nearest-mail-blockquote-color', v); },
                         get webkitMaxLogicalHeight() { return this.getPropertyValue('-webkit-max-logical-height'); },
                         set webkitMaxLogicalHeight(v) { this.setProperty('-webkit-max-logical-height', v); },
                         get webkitMaxLogicalWidth() { return this.getPropertyValue('-webkit-max-logical-width'); },
                         set webkitMaxLogicalWidth(v) { this.setProperty('-webkit-max-logical-width', v); },
                         get webkitMinLogicalHeight() { return this.getPropertyValue('-webkit-min-logical-height'); },
                         set webkitMinLogicalHeight(v) { this.setProperty('-webkit-min-logical-height', v); },
                         get webkitMinLogicalWidth() { return this.getPropertyValue('-webkit-min-logical-width'); },
                         set webkitMinLogicalWidth(v) { this.setProperty('-webkit-min-logical-width', v); },
                         get webkitNbspMode() { return this.getPropertyValue('-webkit-nbsp-mode'); },
                         set webkitNbspMode(v) { this.setProperty('-webkit-nbsp-mode', v); },
                         get webkitOverflowScrolling() { return this.getPropertyValue('-webkit-overflow-scrolling'); },
                         set webkitOverflowScrolling(v) { this.setProperty('-webkit-overflow-scrolling', v); },
                         get webkitPaddingAfter() { return this.getPropertyValue('-webkit-padding-after'); },
                         set webkitPaddingAfter(v) { this.setProperty('-webkit-padding-after', v); },
                         get webkitPaddingBefore() { return this.getPropertyValue('-webkit-padding-before'); },
                         set webkitPaddingBefore(v) { this.setProperty('-webkit-padding-before', v); },
                         get webkitPaddingEnd() { return this.getPropertyValue('-webkit-padding-end'); },
                         set webkitPaddingEnd(v) { this.setProperty('-webkit-padding-end', v); },
                         get webkitPaddingStart() { return this.getPropertyValue('-webkit-padding-start'); },
                         set webkitPaddingStart(v) { this.setProperty('-webkit-padding-start', v); },
                         get webkitPerspective() { return this.getPropertyValue('-webkit-perspective'); },
                         set webkitPerspective(v) { this.setProperty('-webkit-perspective', v); },
                         get webkitPerspectiveOrigin() { return this.getPropertyValue('-webkit-perspective-origin'); },
                         set webkitPerspectiveOrigin(v) { this.setProperty('-webkit-perspective-origin', v); },
                         get webkitPerspectiveOriginX() { return this.getPropertyValue('-webkit-perspective-origin-x'); },
                         set webkitPerspectiveOriginX(v) { this.setProperty('-webkit-perspective-origin-x', v); },
                         get webkitPerspectiveOriginY() { return this.getPropertyValue('-webkit-perspective-origin-y'); },
                         set webkitPerspectiveOriginY(v) { this.setProperty('-webkit-perspective-origin-y', v); },
                         get webkitPrintColorAdjust() { return this.getPropertyValue('-webkit-print-color-adjust'); },
                         set webkitPrintColorAdjust(v) { this.setProperty('-webkit-print-color-adjust', v); },
                         get webkitRegionBreakAfter() { return this.getPropertyValue('-webkit-region-break-after'); },
                         set webkitRegionBreakAfter(v) { this.setProperty('-webkit-region-break-after', v); },
                         get webkitRegionBreakBefore() { return this.getPropertyValue('-webkit-region-break-before'); },
                         set webkitRegionBreakBefore(v) { this.setProperty('-webkit-region-break-before', v); },
                         get webkitRegionBreakInside() { return this.getPropertyValue('-webkit-region-break-inside'); },
                         set webkitRegionBreakInside(v) { this.setProperty('-webkit-region-break-inside', v); },
                         get webkitRegionOverflow() { return this.getPropertyValue('-webkit-region-overflow'); },
                         set webkitRegionOverflow(v) { this.setProperty('-webkit-region-overflow', v); },
                         get webkitRtlOrdering() { return this.getPropertyValue('-webkit-rtl-ordering'); },
                         set webkitRtlOrdering(v) { this.setProperty('-webkit-rtl-ordering', v); },
                         get webkitSvgShadow() { return this.getPropertyValue('-webkit-svg-shadow'); },
                         set webkitSvgShadow(v) { this.setProperty('-webkit-svg-shadow', v); },
                         get webkitTapHighlightColor() { return this.getPropertyValue('-webkit-tap-highlight-color'); },
                         set webkitTapHighlightColor(v) { this.setProperty('-webkit-tap-highlight-color', v); },
                         get webkitTextCombine() { return this.getPropertyValue('-webkit-text-combine'); },
                         set webkitTextCombine(v) { this.setProperty('-webkit-text-combine', v); },
                         get webkitTextDecorationsInEffect() { return this.getPropertyValue('-webkit-text-decorations-in-effect'); },
                         set webkitTextDecorationsInEffect(v) { this.setProperty('-webkit-text-decorations-in-effect', v); },
                         get webkitTextEmphasis() { return this.getPropertyValue('-webkit-text-emphasis'); },
                         set webkitTextEmphasis(v) { this.setProperty('-webkit-text-emphasis', v); },
                         get webkitTextEmphasisColor() { return this.getPropertyValue('-webkit-text-emphasis-color'); },
                         set webkitTextEmphasisColor(v) { this.setProperty('-webkit-text-emphasis-color', v); },
                         get webkitTextEmphasisPosition() { return this.getPropertyValue('-webkit-text-emphasis-position'); },
                         set webkitTextEmphasisPosition(v) { this.setProperty('-webkit-text-emphasis-position', v); },
                         get webkitTextEmphasisStyle() { return this.getPropertyValue('-webkit-text-emphasis-style'); },
                         set webkitTextEmphasisStyle(v) { this.setProperty('-webkit-text-emphasis-style', v); },
                         get webkitTextFillColor() { return this.getPropertyValue('-webkit-text-fill-color'); },
                         set webkitTextFillColor(v) { this.setProperty('-webkit-text-fill-color', v); },
                         get webkitTextOrientation() { return this.getPropertyValue('-webkit-text-orientation'); },
                         set webkitTextOrientation(v) { this.setProperty('-webkit-text-orientation', v); },
                         get webkitTextSecurity() { return this.getPropertyValue('-webkit-text-security'); },
                         set webkitTextSecurity(v) { this.setProperty('-webkit-text-security', v); },
                         get webkitTextSizeAdjust() { return this.getPropertyValue('-webkit-text-size-adjust'); },
                         set webkitTextSizeAdjust(v) { this.setProperty('-webkit-text-size-adjust', v); },
                         get webkitTextStroke() { return this.getPropertyValue('-webkit-text-stroke'); },
                         set webkitTextStroke(v) { this.setProperty('-webkit-text-stroke', v); },
                         get webkitTextStrokeColor() { return this.getPropertyValue('-webkit-text-stroke-color'); },
                         set webkitTextStrokeColor(v) { this.setProperty('-webkit-text-stroke-color', v); },
                         get webkitTextStrokeWidth() { return this.getPropertyValue('-webkit-text-stroke-width'); },
                         set webkitTextStrokeWidth(v) { this.setProperty('-webkit-text-stroke-width', v); },
                         get webkitTransform() { return this.getPropertyValue('-webkit-transform'); },
                         set webkitTransform(v) { this.setProperty('-webkit-transform', v); },
                         get webkitTransformOrigin() { return this.getPropertyValue('-webkit-transform-origin'); },
                         set webkitTransformOrigin(v) { this.setProperty('-webkit-transform-origin', v); },
                         get webkitTransformOriginX() { return this.getPropertyValue('-webkit-transform-origin-x'); },
                         set webkitTransformOriginX(v) { this.setProperty('-webkit-transform-origin-x', v); },
                         get webkitTransformOriginY() { return this.getPropertyValue('-webkit-transform-origin-y'); },
                         set webkitTransformOriginY(v) { this.setProperty('-webkit-transform-origin-y', v); },
                         get webkitTransformOriginZ() { return this.getPropertyValue('-webkit-transform-origin-z'); },
                         set webkitTransformOriginZ(v) { this.setProperty('-webkit-transform-origin-z', v); },
                         get webkitTransformStyle() { return this.getPropertyValue('-webkit-transform-style'); },
                         set webkitTransformStyle(v) { this.setProperty('-webkit-transform-style', v); },
                         get webkitTransition() { return this.getPropertyValue('-webkit-transition'); },
                         set webkitTransition(v) { this.setProperty('-webkit-transition', v); },
                         get webkitTransitionDelay() { return this.getPropertyValue('-webkit-transition-delay'); },
                         set webkitTransitionDelay(v) { this.setProperty('-webkit-transition-delay', v); },
                         get webkitTransitionDuration() { return this.getPropertyValue('-webkit-transition-duration'); },
                         set webkitTransitionDuration(v) { this.setProperty('-webkit-transition-duration', v); },
                         get webkitTransitionProperty() { return this.getPropertyValue('-webkit-transition-property'); },
                         set webkitTransitionProperty(v) { this.setProperty('-webkit-transition-property', v); },
                         get webkitTransitionTimingFunction() { return this.getPropertyValue('-webkit-transition-timing-function'); },
                         set webkitTransitionTimingFunction(v) { this.setProperty('-webkit-transition-timing-function', v); },
                         get webkitUserDrag() { return this.getPropertyValue('-webkit-user-drag'); },
                         set webkitUserDrag(v) { this.setProperty('-webkit-user-drag', v); },
                         get webkitUserModify() { return this.getPropertyValue('-webkit-user-modify'); },
                         set webkitUserModify(v) { this.setProperty('-webkit-user-modify', v); },
                         get webkitUserSelect() { return this.getPropertyValue('-webkit-user-select'); },
                         set webkitUserSelect(v) { this.setProperty('-webkit-user-select', v); },
                         get webkitWrap() { return this.getPropertyValue('-webkit-wrap'); },
                         set webkitWrap(v) { this.setProperty('-webkit-wrap', v); },
                         get webkitWrapFlow() { return this.getPropertyValue('-webkit-wrap-flow'); },
                         set webkitWrapFlow(v) { this.setProperty('-webkit-wrap-flow', v); },
                         get webkitWrapMargin() { return this.getPropertyValue('-webkit-wrap-margin'); },
                         set webkitWrapMargin(v) { this.setProperty('-webkit-wrap-margin', v); },
                         get webkitWrapPadding() { return this.getPropertyValue('-webkit-wrap-padding'); },
                         set webkitWrapPadding(v) { this.setProperty('-webkit-wrap-padding', v); },
                         get webkitWrapShapeInside() { return this.getPropertyValue('-webkit-wrap-shape-inside'); },
                         set webkitWrapShapeInside(v) { this.setProperty('-webkit-wrap-shape-inside', v); },
                         get webkitWrapShapeOutside() { return this.getPropertyValue('-webkit-wrap-shape-outside'); },
                         set webkitWrapShapeOutside(v) { this.setProperty('-webkit-wrap-shape-outside', v); },
                         get webkitWrapThrough() { return this.getPropertyValue('-webkit-wrap-through'); },
                         set webkitWrapThrough(v) { this.setProperty('-webkit-wrap-through', v); },
                         get webkitWritingMode() { return this.getPropertyValue('-webkit-writing-mode'); },
                         set webkitWritingMode(v) { this.setProperty('-webkit-writing-mode', v); },
                         get whiteSpace() { return this.getPropertyValue('white-space'); },
                         set whiteSpace(v) { this.setProperty('white-space', v); },
                         get widows() { return this.getPropertyValue('widows'); },
                         set widows(v) { this.setProperty('widows', v); },
                         get width() { return this.getPropertyValue('width'); },
                         set width(v) { this.setProperty('width', v); },
                         get wordBreak() { return this.getPropertyValue('word-break'); },
                         set wordBreak(v) { this.setProperty('word-break', v); },
                         get wordSpacing() { return this.getPropertyValue('word-spacing'); },
                         set wordSpacing(v) { this.setProperty('word-spacing', v); },
                         get wordWrap() { return this.getPropertyValue('word-wrap'); },
                         set wordWrap(v) { this.setProperty('word-wrap', v); },
                         get writingMode() { return this.getPropertyValue('writing-mode'); },
                         set writingMode(v) { this.setProperty('writing-mode', v); },
                         get zIndex() { return this.getPropertyValue('z-index'); },
                         set zIndex(v) { this.setProperty('z-index', v); },
                         get zoom() { return this.getPropertyValue('zoom'); },
                         set zoom(v) { this.setProperty('zoom', v); }

                     };

                     /*
                       var property_files = fs.readdirSync(__dirname + '/properties');
                       var self = this;
                       property_files.forEach(function (property) {
                       if (property.substr(-3) === '.js') {
                       property = path.basename(property, '.js');
                       Object.defineProperty(self, property, require('./properties/' + property));
                       }
                       });
                       };
                     */

                     exports.CSSStyleDeclaration = CSSStyleDeclaration;

                 })()
             },{"fs":3,"path":5,"cssom":6}],6:[function(require,module,exports){
                 'use strict';


                 exports.CSSStyleDeclaration = require('./CSSStyleDeclaration').CSSStyleDeclaration;
                 exports.CSSRule = require('./CSSRule').CSSRule;
                 exports.CSSStyleRule = require('./CSSStyleRule').CSSStyleRule;
                 exports.MediaList = require('./MediaList').MediaList;
                 exports.CSSMediaRule = require('./CSSMediaRule').CSSMediaRule;
                 exports.CSSImportRule = require('./CSSImportRule').CSSImportRule;
                 exports.CSSFontFaceRule = require('./CSSFontFaceRule').CSSFontFaceRule;
                 exports.StyleSheet = require('./StyleSheet').StyleSheet;
                 exports.CSSStyleSheet = require('./CSSStyleSheet').CSSStyleSheet;
                 exports.CSSKeyframesRule = require('./CSSKeyframesRule').CSSKeyframesRule;
                 exports.CSSKeyframeRule = require('./CSSKeyframeRule').CSSKeyframeRule;
                 exports.parse = require('./parse').parse;
                 exports.clone = require('./clone').clone;

             },{"./CSSStyleDeclaration":7,"./CSSRule":8,"./CSSStyleRule":9,"./MediaList":10,"./CSSMediaRule":11,"./CSSImportRule":12,"./CSSFontFaceRule":13,"./StyleSheet":14,"./CSSStyleSheet":15,"./CSSKeyframesRule":16,"./CSSKeyframeRule":17,"./parse":18,"./clone":19}],8:[function(require,module,exports){
                 //.CommonJS
                 var CSSOM = {};
                 ///CommonJS


                 /**
                  * @constructor
                  * @see http://dev.w3.org/csswg/cssom/#the-cssrule-interface
                  * @see http://www.w3.org/TR/DOM-Level-2-Style/css.html#CSS-CSSRule
                  */
                 CSSOM.CSSRule = function CSSRule() {
	                 this.parentRule = null;
	                 this.parentStyleSheet = null;
                 };

                 CSSOM.CSSRule.STYLE_RULE = 1;
                 CSSOM.CSSRule.IMPORT_RULE = 3;
                 CSSOM.CSSRule.MEDIA_RULE = 4;
                 CSSOM.CSSRule.FONT_FACE_RULE = 5;
                 CSSOM.CSSRule.PAGE_RULE = 6;
                 CSSOM.CSSRule.WEBKIT_KEYFRAMES_RULE = 8;
                 CSSOM.CSSRule.WEBKIT_KEYFRAME_RULE = 9;

                 // Obsolete in CSSOM http://dev.w3.org/csswg/cssom/
                 //CSSOM.CSSRule.UNKNOWN_RULE = 0;
                 //CSSOM.CSSRule.CHARSET_RULE = 2;

                 // Never implemented
                 //CSSOM.CSSRule.VARIABLES_RULE = 7;

                 CSSOM.CSSRule.prototype = {
	                 constructor: CSSOM.CSSRule
	                 //FIXME
                 };


                 //.CommonJS
                 exports.CSSRule = CSSOM.CSSRule;
                 ///CommonJS

             },{}],10:[function(require,module,exports){
                 //.CommonJS
                 var CSSOM = {};
                 ///CommonJS


                 /**
                  * @constructor
                  * @see http://dev.w3.org/csswg/cssom/#the-medialist-interface
                  */
                 CSSOM.MediaList = function MediaList(){
	                 this.length = 0;
                 };

                 CSSOM.MediaList.prototype = {

	                 constructor: CSSOM.MediaList,

	                 /**
	                  * @return {string}
	                  */
	                 get mediaText() {
		                 return Array.prototype.join.call(this, ", ");
	                 },

	                 /**
	                  * @param {string} value
	                  */
	                 set mediaText(value) {
		                 var values = value.split(",");
		                 var length = this.length = values.length;
		                 for (var i=0; i<length; i++) {
			                 this[i] = values[i].trim();
		                 }
	                 },

	                 /**
	                  * @param {string} medium
	                  */
	                 appendMedium: function(medium) {
		                 if (Array.prototype.indexOf.call(this, medium) === -1) {
			                 this[this.length] = medium;
			                 this.length++;
		                 }
	                 },

	                 /**
	                  * @param {string} medium
	                  */
	                 deleteMedium: function(medium) {
		                 var index = Array.prototype.indexOf.call(this, medium);
		                 if (index !== -1) {
			                 Array.prototype.splice.call(this, index, 1);
		                 }
	                 }

                 };


                 //.CommonJS
                 exports.MediaList = CSSOM.MediaList;
                 ///CommonJS

             },{}],14:[function(require,module,exports){
                 //.CommonJS
                 var CSSOM = {};
                 ///CommonJS


                 /**
                  * @constructor
                  * @see http://dev.w3.org/csswg/cssom/#the-stylesheet-interface
                  */
                 CSSOM.StyleSheet = function StyleSheet() {
	                 this.parentStyleSheet = null;
                 };


                 //.CommonJS
                 exports.StyleSheet = CSSOM.StyleSheet;
                 ///CommonJS

             },{}],7:[function(require,module,exports){
                 //.CommonJS
                 var CSSOM = {};
                 ///CommonJS


                 /**
                  * @constructor
                  * @see http://www.w3.org/TR/DOM-Level-2-Style/css.html#CSS-CSSStyleDeclaration
                  */
                 CSSOM.CSSStyleDeclaration = function CSSStyleDeclaration(){
	                 this.length = 0;
	                 this.parentRule = null;

	                 // NON-STANDARD
	                 this._importants = {};
                 };


                 CSSOM.CSSStyleDeclaration.prototype = {

	                 constructor: CSSOM.CSSStyleDeclaration,

	                 /**
	                  *
	                  * @param {string} name
	                  * @see http://www.w3.org/TR/DOM-Level-2-Style/css.html#CSS-CSSStyleDeclaration-getPropertyValue
	                  * @return {string} the value of the property if it has been explicitly set for this declaration block.
	                  * Returns the empty string if the property has not been set.
	                  */
	                 getPropertyValue: function(name) {
		                 return this[name] || "";
	                 },

	                 /**
	                  *
	                  * @param {string} name
	                  * @param {string} value
	                  * @param {string} [priority=null] "important" or null
	                  * @see http://www.w3.org/TR/DOM-Level-2-Style/css.html#CSS-CSSStyleDeclaration-setProperty
	                  */
	                 setProperty: function(name, value, priority) {
		                 if (this[name]) {
			                 // Property already exist. Overwrite it.
			                 var index = Array.prototype.indexOf.call(this, name);
			                 if (index < 0) {
				                 this[this.length] = name;
				                 this.length++;
			                 }
		                 } else {
			                 // New property.
			                 this[this.length] = name;
			                 this.length++;
		                 }
		                 this[name] = value;
		                 this._importants[name] = priority;
	                 },

	                 /**
	                  *
	                  * @param {string} name
	                  * @see http://www.w3.org/TR/DOM-Level-2-Style/css.html#CSS-CSSStyleDeclaration-removeProperty
	                  * @return {string} the value of the property if it has been explicitly set for this declaration block.
	                  * Returns the empty string if the property has not been set or the property name does not correspond to a known CSS property.
	                  */
	                 removeProperty: function(name) {
		                 if (!(name in this)) {
			                 return "";
		                 }
		                 var index = Array.prototype.indexOf.call(this, name);
		                 if (index < 0) {
			                 return "";
		                 }
		                 var prevValue = this[name];
		                 this[name] = "";

		                 // That's what WebKit and Opera do
		                 Array.prototype.splice.call(this, index, 1);

		                 // That's what Firefox does
		                 //this[index] = ""

		                 return prevValue;
	                 },

	                 getPropertyCSSValue: function() {
		                 //FIXME
	                 },

	                 /**
	                  *
	                  * @param {String} name
	                  */
	                 getPropertyPriority: function(name) {
		                 return this._importants[name] || "";
	                 },


	                 /**
	                  *   element.style.overflow = "auto"
	                  *   element.style.getPropertyShorthand("overflow-x")
	                  *   -> "overflow"
	                  */
	                 getPropertyShorthand: function() {
		                 //FIXME
	                 },

	                 isPropertyImplicit: function() {
		                 //FIXME
	                 },

	                 // Doesn't work in IE < 9
	                 get cssText(){
		                 var properties = [];
		                 for (var i=0, length=this.length; i < length; ++i) {
			                 var name = this[i];
			                 var value = this.getPropertyValue(name);
			                 var priority = this.getPropertyPriority(name);
			                 if (priority) {
				                 priority = " !" + priority;
			                 }
			                 properties[i] = name + ": " + value + priority + ";";
		                 }
		                 return properties.join(" ");
	                 },

	                 set cssText(cssText){
		                 var i, name;
		                 for (i = this.length; i--;) {
			                 name = this[i];
			                 this[name] = "";
		                 }
		                 Array.prototype.splice.call(this, 0, this.length);
		                 this._importants = {};

		                 var dummyRule = CSSOM.parse('#bogus{' + cssText + '}').cssRules[0].style;
		                 var length = dummyRule.length;
		                 for (i = 0; i < length; ++i) {
			                 name = dummyRule[i];
			                 this.setProperty(dummyRule[i], dummyRule.getPropertyValue(name), dummyRule.getPropertyPriority(name));
		                 }
	                 }
                 };


                 //.CommonJS
                 exports.CSSStyleDeclaration = CSSOM.CSSStyleDeclaration;
                 CSSOM.parse = require('./parse').parse; // Cannot be included sooner due to the mutual dependency between parse.js and CSSStyleDeclaration.js
                 ///CommonJS

             },{"./parse":18}],9:[function(require,module,exports){
                 //.CommonJS
                 var CSSOM = {
	                 CSSStyleDeclaration: require("./CSSStyleDeclaration").CSSStyleDeclaration,
	                 CSSRule: require("./CSSRule").CSSRule
                 };
                 ///CommonJS


                 /**
                  * @constructor
                  * @see http://dev.w3.org/csswg/cssom/#cssstylerule
                  * @see http://www.w3.org/TR/DOM-Level-2-Style/css.html#CSS-CSSStyleRule
                  */
                 CSSOM.CSSStyleRule = function CSSStyleRule() {
	                 CSSOM.CSSRule.call(this);
	                 this.selectorText = "";
	                 this.style = new CSSOM.CSSStyleDeclaration;
	                 this.style.parentRule = this;
                 };

                 CSSOM.CSSStyleRule.prototype = new CSSOM.CSSRule;
                 CSSOM.CSSStyleRule.prototype.constructor = CSSOM.CSSStyleRule;
                 CSSOM.CSSStyleRule.prototype.type = 1;

                 CSSOM.CSSStyleRule.prototype.__defineGetter__("cssText", function() {
	                 var text;
	                 if (this.selectorText) {
		                 text = this.selectorText + " {" + this.style.cssText + "}";
	                 } else {
		                 text = "";
	                 }
	                 return text;
                 });

                 CSSOM.CSSStyleRule.prototype.__defineSetter__("cssText", function(cssText) {
	                 var rule = CSSOM.CSSStyleRule.parse(cssText);
	                 this.style = rule.style;
	                 this.selectorText = rule.selectorText;
                 });


                 /**
                  * NON-STANDARD
                  * lightweight version of parse.js.
                  * @param {string} ruleText
                  * @return CSSStyleRule
                  */
                 CSSOM.CSSStyleRule.parse = function(ruleText) {
	                 var i = 0;
	                 var state = "selector";
	                 var index;
	                 var j = i;
	                 var buffer = "";

	                 var SIGNIFICANT_WHITESPACE = {
		                 "selector": true,
		                 "value": true
	                 };

	                 var styleRule = new CSSOM.CSSStyleRule;
	                 var selector, name, value, priority="";

	                 for (var character; character = ruleText.charAt(i); i++) {

		                 switch (character) {

		                 case " ":
		                 case "\t":
		                 case "\r":
		                 case "\n":
		                 case "\f":
			                 if (SIGNIFICANT_WHITESPACE[state]) {
				                 // Squash 2 or more white-spaces in the row into 1
				                 switch (ruleText.charAt(i - 1)) {
					             case " ":
					             case "\t":
					             case "\r":
					             case "\n":
					             case "\f":
						             break;
					             default:
						             buffer += " ";
						             break;
				                 }
			                 }
			                 break;

		                     // String
		                 case '"':
			                 j = i + 1;
			                 index = ruleText.indexOf('"', j) + 1;
			                 if (!index) {
				                 throw '" is missing';
			                 }
			                 buffer += ruleText.slice(i, index);
			                 i = index - 1;
			                 break;

		                 case "'":
			                 j = i + 1;
			                 index = ruleText.indexOf("'", j) + 1;
			                 if (!index) {
				                 throw "' is missing";
			                 }
			                 buffer += ruleText.slice(i, index);
			                 i = index - 1;
			                 break;

		                     // Comment
		                 case "/":
			                 if (ruleText.charAt(i + 1) === "*") {
				                 i += 2;
				                 index = ruleText.indexOf("*/", i);
				                 if (index === -1) {
					                 throw new SyntaxError("Missing */");
				                 } else {
					                 i = index + 1;
				                 }
			                 } else {
				                 buffer += character;
			                 }
			                 break;

		                 case "{":
			                 if (state === "selector") {
				                 styleRule.selectorText = buffer.trim();
				                 buffer = "";
				                 state = "name";
			                 }
			                 break;

		                 case ":":
			                 if (state === "name") {
				                 name = buffer.trim();
				                 buffer = "";
				                 state = "value";
			                 } else {
				                 buffer += character;
			                 }
			                 break;

		                 case "!":
			                 if (state === "value" && ruleText.indexOf("!important", i) === i) {
				                 priority = "important";
				                 i += "important".length;
			                 } else {
				                 buffer += character;
			                 }
			                 break;

		                 case ";":
			                 if (state === "value") {
				                 styleRule.style.setProperty(name, buffer.trim(), priority);
				                 priority = "";
				                 buffer = "";
				                 state = "name";
			                 } else {
				                 buffer += character;
			                 }
			                 break;

		                 case "}":
			                 if (state === "value") {
				                 styleRule.style.setProperty(name, buffer.trim(), priority);
				                 priority = "";
				                 buffer = "";
			                 } else if (state === "name") {
				                 break;
			                 } else {
				                 buffer += character;
			                 }
			                 state = "selector";
			                 break;

		                 default:
			                 buffer += character;
			                 break;

		                 }
	                 }

	                 return styleRule;

                 };


                 //.CommonJS
                 exports.CSSStyleRule = CSSOM.CSSStyleRule;
                 ///CommonJS

             },{"./CSSStyleDeclaration":7,"./CSSRule":8}],11:[function(require,module,exports){
                 //.CommonJS
                 var CSSOM = {
	                 CSSRule: require("./CSSRule").CSSRule,
	                 MediaList: require("./MediaList").MediaList
                 };
                 ///CommonJS


                 /**
                  * @constructor
                  * @see http://dev.w3.org/csswg/cssom/#cssmediarule
                  * @see http://www.w3.org/TR/DOM-Level-2-Style/css.html#CSS-CSSMediaRule
                  */
                 CSSOM.CSSMediaRule = function CSSMediaRule() {
	                 CSSOM.CSSRule.call(this);
	                 this.media = new CSSOM.MediaList;
	                 this.cssRules = [];
                 };

                 CSSOM.CSSMediaRule.prototype = new CSSOM.CSSRule;
                 CSSOM.CSSMediaRule.prototype.constructor = CSSOM.CSSMediaRule;
                 CSSOM.CSSMediaRule.prototype.type = 4;
                 //FIXME
                 //CSSOM.CSSMediaRule.prototype.insertRule = CSSStyleSheet.prototype.insertRule;
                 //CSSOM.CSSMediaRule.prototype.deleteRule = CSSStyleSheet.prototype.deleteRule;

                 // http://opensource.apple.com/source/WebCore/WebCore-658.28/css/CSSMediaRule.cpp
                 CSSOM.CSSMediaRule.prototype.__defineGetter__("cssText", function() {
	                 var cssTexts = [];
	                 for (var i=0, length=this.cssRules.length; i < length; i++) {
		                 cssTexts.push(this.cssRules[i].cssText);
	                 }
	                 return "@media " + this.media.mediaText + " {" + cssTexts.join("") + "}";
                 });


                 //.CommonJS
                 exports.CSSMediaRule = CSSOM.CSSMediaRule;
                 ///CommonJS

             },{"./CSSRule":8,"./MediaList":10}],12:[function(require,module,exports){
                 //.CommonJS
                 var CSSOM = {
	                 CSSRule: require("./CSSRule").CSSRule,
	                 CSSStyleSheet: require("./CSSStyleSheet").CSSStyleSheet,
	                 MediaList: require("./MediaList").MediaList
                 };
                 ///CommonJS


                 /**
                  * @constructor
                  * @see http://dev.w3.org/csswg/cssom/#cssimportrule
                  * @see http://www.w3.org/TR/DOM-Level-2-Style/css.html#CSS-CSSImportRule
                  */
                 CSSOM.CSSImportRule = function CSSImportRule() {
	                 CSSOM.CSSRule.call(this);
	                 this.href = "";
	                 this.media = new CSSOM.MediaList;
	                 this.styleSheet = new CSSOM.CSSStyleSheet;
                 };

                 CSSOM.CSSImportRule.prototype = new CSSOM.CSSRule;
                 CSSOM.CSSImportRule.prototype.constructor = CSSOM.CSSImportRule;
                 CSSOM.CSSImportRule.prototype.type = 3;
                 CSSOM.CSSImportRule.prototype.__defineGetter__("cssText", function() {
	                 var mediaText = this.media.mediaText;
	                 return "@import url(" + this.href + ")" + (mediaText ? " " + mediaText : "") + ";";
                 });

                 CSSOM.CSSImportRule.prototype.__defineSetter__("cssText", function(cssText) {
	                 var i = 0;

	                 /**
	                  * @import url(partial.css) screen, handheld;
	                  *        ||               |
	                  *        after-import     media
	                  *         |
	                  *         url
	                  */
	                 var state = '';

	                 var buffer = '';
	                 var index;
	                 var mediaText = '';
	                 for (var character; character = cssText.charAt(i); i++) {

		                 switch (character) {
			             case ' ':
			             case '\t':
			             case '\r':
			             case '\n':
			             case '\f':
				             if (state === 'after-import') {
					             state = 'url';
				             } else {
					             buffer += character;
				             }
				             break;

			             case '@':
				             if (!state && cssText.indexOf('@import', i) === i) {
					             state = 'after-import';
					             i += 'import'.length;
					             buffer = '';
				             }
				             break;

			             case 'u':
				             if (state === 'url' && cssText.indexOf('url(', i) === i) {
					             index = cssText.indexOf(')', i + 1);
					             if (index === -1) {
						             throw i + ': ")" not found';
					             }
					             i += 'url('.length;
					             var url = cssText.slice(i, index);
					             if (url[0] === url[url.length - 1]) {
						             if (url[0] === '"' || url[0] === "'") {
							             url = url.slice(1, -1);
						             }
					             }
					             this.href = url;
					             i = index;
					             state = 'media';
				             }
				             break;

			             case '"':
				             if (state === 'url') {
					             index = cssText.indexOf('"', i + 1);
					             if (!index) {
						             throw i + ": '\"' not found";
					             }
					             this.href = cssText.slice(i + 1, index);
					             i = index;
					             state = 'media';
				             }
				             break;

			             case "'":
				             if (state === 'url') {
					             index = cssText.indexOf("'", i + 1);
					             if (!index) {
						             throw i + ': "\'" not found';
					             }
					             this.href = cssText.slice(i + 1, index);
					             i = index;
					             state = 'media';
				             }
				             break;

			             case ';':
				             if (state === 'media') {
					             if (buffer) {
						             this.media.mediaText = buffer.trim();
					             }
				             }
				             break;

			             default:
				             if (state === 'media') {
					             buffer += character;
				             }
				             break;
		                 }
	                 }
                 });


                 //.CommonJS
                 exports.CSSImportRule = CSSOM.CSSImportRule;
                 ///CommonJS

             },{"./CSSRule":8,"./CSSStyleSheet":15,"./MediaList":10}],13:[function(require,module,exports){
                 //.CommonJS
                 var CSSOM = {
	                 CSSStyleDeclaration: require("./CSSStyleDeclaration").CSSStyleDeclaration,
	                 CSSRule: require("./CSSRule").CSSRule
                 };
                 ///CommonJS


                 /**
                  * @constructor
                  * @see http://dev.w3.org/csswg/cssom/#css-font-face-rule
                  */
                 CSSOM.CSSFontFaceRule = function CSSFontFaceRule() {
	                 CSSOM.CSSRule.call(this);
	                 this.style = new CSSOM.CSSStyleDeclaration;
	                 this.style.parentRule = this;
                 };

                 CSSOM.CSSFontFaceRule.prototype = new CSSOM.CSSRule;
                 CSSOM.CSSFontFaceRule.prototype.constructor = CSSOM.CSSFontFaceRule;
                 CSSOM.CSSFontFaceRule.prototype.type = 5;
                 //FIXME
                 //CSSOM.CSSFontFaceRule.prototype.insertRule = CSSStyleSheet.prototype.insertRule;
                 //CSSOM.CSSFontFaceRule.prototype.deleteRule = CSSStyleSheet.prototype.deleteRule;

                 // http://www.opensource.apple.com/source/WebCore/WebCore-955.66.1/css/WebKitCSSFontFaceRule.cpp
                 CSSOM.CSSFontFaceRule.prototype.__defineGetter__("cssText", function() {
	                 return "@font-face {" + this.style.cssText + "}";
                 });


                 //.CommonJS
                 exports.CSSFontFaceRule = CSSOM.CSSFontFaceRule;
                 ///CommonJS

             },{"./CSSStyleDeclaration":7,"./CSSRule":8}],15:[function(require,module,exports){
                 //.CommonJS
                 var CSSOM = {
	                 StyleSheet: require("./StyleSheet").StyleSheet,
	                 CSSStyleRule: require("./CSSStyleRule").CSSStyleRule
                 };
                 ///CommonJS


                 /**
                  * @constructor
                  * @see http://www.w3.org/TR/DOM-Level-2-Style/css.html#CSS-CSSStyleSheet
                  */
                 CSSOM.CSSStyleSheet = function CSSStyleSheet() {
	                 CSSOM.StyleSheet.call(this);
	                 this.cssRules = [];
                 };


                 CSSOM.CSSStyleSheet.prototype = new CSSOM.StyleSheet;
                 CSSOM.CSSStyleSheet.prototype.constructor = CSSOM.CSSStyleSheet;


                 /**
                  * Used to insert a new rule into the style sheet. The new rule now becomes part of the cascade.
                  *
                  *   sheet = new Sheet("body {margin: 0}")
                  *   sheet.toString()
                  *   -> "body{margin:0;}"
                  *   sheet.insertRule("img {border: none}", 0)
                  *   -> 0
                  *   sheet.toString()
                  *   -> "img{border:none;}body{margin:0;}"
                  *
                  * @param {string} rule
                  * @param {number} index
                  * @see http://www.w3.org/TR/DOM-Level-2-Style/css.html#CSS-CSSStyleSheet-insertRule
                  * @return {number} The index within the style sheet's rule collection of the newly inserted rule.
                  */
                 CSSOM.CSSStyleSheet.prototype.insertRule = function(rule, index) {
	                 if (index < 0 || index > this.cssRules.length) {
		                 throw new RangeError("INDEX_SIZE_ERR");
	                 }
	                 var cssRule = CSSOM.parse(rule).cssRules[0];
	                 this.cssRules.splice(index, 0, cssRule);
	                 return index;
                 };


                 /**
                  * Used to delete a rule from the style sheet.
                  *
                  *   sheet = new Sheet("img{border:none} body{margin:0}")
                  *   sheet.toString()
                  *   -> "img{border:none;}body{margin:0;}"
                  *   sheet.deleteRule(0)
                  *   sheet.toString()
                  *   -> "body{margin:0;}"
                  *
                  * @param {number} index within the style sheet's rule list of the rule to remove.
                  * @see http://www.w3.org/TR/DOM-Level-2-Style/css.html#CSS-CSSStyleSheet-deleteRule
                  */
                 CSSOM.CSSStyleSheet.prototype.deleteRule = function(index) {
	                 if (index < 0 || index >= this.cssRules.length) {
		                 throw new RangeError("INDEX_SIZE_ERR");
	                 }
	                 this.cssRules.splice(index, 1);
                 };


                 /**
                  * NON-STANDARD
                  * @return {string} serialize stylesheet
                  */
                 CSSOM.CSSStyleSheet.prototype.toString = function() {
	                 var result = "";
	                 var rules = this.cssRules;
	                 for (var i=0; i<rules.length; i++) {
		                 result += rules[i].cssText + "\n";
	                 }
	                 return result;
                 };


                 //.CommonJS
                 exports.CSSStyleSheet = CSSOM.CSSStyleSheet;
                 CSSOM.parse = require('./parse').parse; // Cannot be included sooner due to the mutual dependency between parse.js and CSSStyleSheet.js
                 ///CommonJS

             },{"./StyleSheet":14,"./CSSStyleRule":9,"./parse":18}],16:[function(require,module,exports){
                 //.CommonJS
                 var CSSOM = {
	                 CSSRule: require("./CSSRule").CSSRule
                 };
                 ///CommonJS


                 /**
                  * @constructor
                  * @see http://www.w3.org/TR/css3-animations/#DOM-CSSKeyframesRule
                  */
                 CSSOM.CSSKeyframesRule = function CSSKeyframesRule() {
	                 CSSOM.CSSRule.call(this);
	                 this.name = '';
	                 this.cssRules = [];
                 };

                 CSSOM.CSSKeyframesRule.prototype = new CSSOM.CSSRule;
                 CSSOM.CSSKeyframesRule.prototype.constructor = CSSOM.CSSKeyframesRule;
                 CSSOM.CSSKeyframesRule.prototype.type = 8;
                 //FIXME
                 //CSSOM.CSSKeyframesRule.prototype.insertRule = CSSStyleSheet.prototype.insertRule;
                 //CSSOM.CSSKeyframesRule.prototype.deleteRule = CSSStyleSheet.prototype.deleteRule;

                 // http://www.opensource.apple.com/source/WebCore/WebCore-955.66.1/css/WebKitCSSKeyframesRule.cpp
                 CSSOM.CSSKeyframesRule.prototype.__defineGetter__("cssText", function() {
	                 var cssTexts = [];
	                 for (var i=0, length=this.cssRules.length; i < length; i++) {
		                 cssTexts.push("  " + this.cssRules[i].cssText);
	                 }
	                 return "@" + (this._vendorPrefix || '') + "keyframes " + this.name + " { \n" + cssTexts.join("\n") + "\n}";
                 });


                 //.CommonJS
                 exports.CSSKeyframesRule = CSSOM.CSSKeyframesRule;
                 ///CommonJS

             },{"./CSSRule":8}],17:[function(require,module,exports){
                 //.CommonJS
                 var CSSOM = {
	                 CSSRule: require("./CSSRule").CSSRule,
	                 CSSStyleDeclaration: require('./CSSStyleDeclaration').CSSStyleDeclaration
                 };
                 ///CommonJS


                 /**
                  * @constructor
                  * @see http://www.w3.org/TR/css3-animations/#DOM-CSSKeyframeRule
                  */
                 CSSOM.CSSKeyframeRule = function CSSKeyframeRule() {
	                 CSSOM.CSSRule.call(this);
	                 this.keyText = '';
	                 this.style = new CSSOM.CSSStyleDeclaration;
	                 this.style.parentRule = this;
                 };

                 CSSOM.CSSKeyframeRule.prototype = new CSSOM.CSSRule;
                 CSSOM.CSSKeyframeRule.prototype.constructor = CSSOM.CSSKeyframeRule;
                 CSSOM.CSSKeyframeRule.prototype.type = 9;
                 //FIXME
                 //CSSOM.CSSKeyframeRule.prototype.insertRule = CSSStyleSheet.prototype.insertRule;
                 //CSSOM.CSSKeyframeRule.prototype.deleteRule = CSSStyleSheet.prototype.deleteRule;

                 // http://www.opensource.apple.com/source/WebCore/WebCore-955.66.1/css/WebKitCSSKeyframeRule.cpp
                 CSSOM.CSSKeyframeRule.prototype.__defineGetter__("cssText", function() {
	                 return this.keyText + " {" + this.style.cssText + "} ";
                 });


                 //.CommonJS
                 exports.CSSKeyframeRule = CSSOM.CSSKeyframeRule;
                 ///CommonJS

             },{"./CSSRule":8,"./CSSStyleDeclaration":7}],18:[function(require,module,exports){
                 //.CommonJS
                 var CSSOM = {};
                 ///CommonJS


                 /**
                  * @param {string} token
                  */
                 CSSOM.parse = function parse(token) {

	                 var i = 0;

	                 /**
	                    "before-selector" or
	                    "selector" or
	                    "atRule" or
	                    "atBlock" or
	                    "before-name" or
	                    "name" or
	                    "before-value" or
	                    "value"
	                 */
	                 var state = "before-selector";

	                 var index;
	                 var buffer = "";

	                 var SIGNIFICANT_WHITESPACE = {
		                 "selector": true,
		                 "value": true,
		                 "atRule": true,
		                 "importRule-begin": true,
		                 "importRule": true,
		                 "atBlock": true
	                 };

	                 var styleSheet = new CSSOM.CSSStyleSheet;

	                 // @type CSSStyleSheet|CSSMediaRule|CSSFontFaceRule|CSSKeyframesRule
	                 var currentScope = styleSheet;

	                 // @type CSSMediaRule|CSSKeyframesRule
	                 var parentRule;

	                 var selector, name, value, priority="", styleRule, mediaRule, importRule, fontFaceRule, keyframesRule, keyframeRule;

	                 var atKeyframesRegExp = /@(-(?:\w+-)+)?keyframes/g;

	                 var parseError = function(message) {
		                 var lines = token.substring(0, i).split('\n');
		                 var lineCount = lines.length;
		                 var charCount = lines.pop().length + 1;
		                 var error = new Error(message + ' (line ' + lineCount + ', char ' + charCount + ')');
		                 error.line = lineCount;
		                 error.char = charCount;
		                 error.styleSheet = styleSheet;
		                 throw error;
	                 };

	                 for (var character; character = token.charAt(i); i++) {

		                 switch (character) {

		                 case " ":
		                 case "\t":
		                 case "\r":
		                 case "\n":
		                 case "\f":
			                 if (SIGNIFICANT_WHITESPACE[state]) {
				                 buffer += character;
			                 }
			                 break;

		                     // String
		                 case '"':
			                 index = token.indexOf('"', i + 1) + 1;
			                 if (!index) {
				                 parseError('Unmatched "');
			                 }
			                 buffer += token.slice(i, index);
			                 i = index - 1;
			                 switch (state) {
				             case 'before-value':
					             state = 'value';
					             break;
				             case 'importRule-begin':
					             state = 'importRule';
					             break;
			                 }
			                 break;

		                 case "'":
			                 index = token.indexOf("'", i + 1) + 1;
			                 if (!index) {
				                 parseError("Unmatched '");
			                 }
			                 buffer += token.slice(i, index);
			                 i = index - 1;
			                 switch (state) {
				             case 'before-value':
					             state = 'value';
					             break;
				             case 'importRule-begin':
					             state = 'importRule';
					             break;
			                 }
			                 break;

		                     // Comment
		                 case "/":
			                 if (token.charAt(i + 1) === "*") {
				                 i += 2;
				                 index = token.indexOf("*/", i);
				                 if (index === -1) {
					                 parseError("Missing */");
				                 } else {
					                 i = index + 1;
				                 }
			                 } else {
				                 buffer += character;
			                 }
			                 if (state === "importRule-begin") {
				                 buffer += " ";
				                 state = "importRule";
			                 }
			                 break;

		                     // At-rule
		                 case "@":
			                 if (token.indexOf("@media", i) === i) {
				                 state = "atBlock";
				                 mediaRule = new CSSOM.CSSMediaRule;
				                 mediaRule.__starts = i;
				                 i += "media".length;
				                 buffer = "";
				                 break;
			                 } else if (token.indexOf("@import", i) === i) {
				                 state = "importRule-begin";
				                 i += "import".length;
				                 buffer += "@import";
				                 break;
			                 } else if (token.indexOf("@font-face", i) === i) {
				                 state = "fontFaceRule-begin";
				                 i += "font-face".length;
				                 fontFaceRule = new CSSOM.CSSFontFaceRule;
				                 fontFaceRule.__starts = i;
				                 buffer = "";
				                 break;
			                 } else {
				                 atKeyframesRegExp.lastIndex = i;
				                 var matchKeyframes = atKeyframesRegExp.exec(token);
				                 if (matchKeyframes && matchKeyframes.index === i) {
					                 state = "keyframesRule-begin";
					                 keyframesRule = new CSSOM.CSSKeyframesRule;
					                 keyframesRule.__starts = i;
					                 keyframesRule._vendorPrefix = matchKeyframes[1]; // Will come out as undefined if no prefix was found
					                 i += matchKeyframes[0].length - 1;
					                 buffer = "";
					                 break;
				                 } else if (state == "selector") {
					                 state = "atRule";
				                 }
			                 }
			                 buffer += character;
			                 break;

		                 case "{":
			                 if (state === "selector" || state === "atRule") {
				                 styleRule.selectorText = buffer.trim();
				                 styleRule.style.__starts = i;
				                 buffer = "";
				                 state = "before-name";
			                 } else if (state === "atBlock") {
				                 mediaRule.media.mediaText = buffer.trim();
				                 currentScope = parentRule = mediaRule;
				                 mediaRule.parentStyleSheet = styleSheet;
				                 buffer = "";
				                 state = "before-selector";
			                 } else if (state === "fontFaceRule-begin") {
				                 if (parentRule) {
					                 fontFaceRule.parentRule = parentRule;
				                 }
				                 fontFaceRule.parentStyleSheet = styleSheet;
				                 styleRule = fontFaceRule;
				                 buffer = "";
				                 state = "before-name";
			                 } else if (state === "keyframesRule-begin") {
				                 keyframesRule.name = buffer.trim();
				                 if (parentRule) {
					                 keyframesRule.parentRule = parentRule;
				                 }
				                 keyframesRule.parentStyleSheet = styleSheet;
				                 currentScope = parentRule = keyframesRule;
				                 buffer = "";
				                 state = "keyframeRule-begin";
			                 } else if (state === "keyframeRule-begin") {
				                 styleRule = new CSSOM.CSSKeyframeRule;
				                 styleRule.keyText = buffer.trim();
				                 styleRule.__starts = i;
				                 buffer = "";
				                 state = "before-name";
			                 }
			                 break;

		                 case ":":
			                 if (state === "name") {
				                 name = buffer.trim();
				                 buffer = "";
				                 state = "before-value";
			                 } else {
				                 buffer += character;
			                 }
			                 break;

		                 case '(':
			                 if (state === 'value') {
				                 index = token.indexOf(')', i + 1);
				                 if (index === -1) {
					                 parseError('Unmatched "("');
				                 }
				                 buffer += token.slice(i, index + 1);
				                 i = index;
			                 } else {
				                 buffer += character;
			                 }
			                 break;

		                 case "!":
			                 if (state === "value" && token.indexOf("!important", i) === i) {
				                 priority = "important";
				                 i += "important".length;
			                 } else {
				                 buffer += character;
			                 }
			                 break;

		                 case ";":
			                 switch (state) {
				             case "value":
					             styleRule.style.setProperty(name, buffer.trim(), priority);
					             priority = "";
					             buffer = "";
					             state = "before-name";
					             break;
				             case "atRule":
					             buffer = "";
					             state = "before-selector";
					             break;
				             case "importRule":
					             importRule = new CSSOM.CSSImportRule;
					             importRule.parentStyleSheet = importRule.styleSheet.parentStyleSheet = styleSheet;
					             importRule.cssText = buffer + character;
					             styleSheet.cssRules.push(importRule);
					             buffer = "";
					             state = "before-selector";
					             break;
				             default:
					             buffer += character;
					             break;
			                 }
			                 break;

		                 case "}":
			                 switch (state) {
				             case "value":
					             styleRule.style.setProperty(name, buffer.trim(), priority);
					             priority = "";
				             case "before-name":
				             case "name":
					             styleRule.__ends = i + 1;
					             if (parentRule) {
						             styleRule.parentRule = parentRule;
					             }
					             styleRule.parentStyleSheet = styleSheet;
					             currentScope.cssRules.push(styleRule);
					             buffer = "";
					             if (currentScope.constructor === CSSOM.CSSKeyframesRule) {
						             state = "keyframeRule-begin";
					             } else {
						             state = "before-selector";
					             }
					             break;
				             case "keyframeRule-begin":
				             case "before-selector":
				             case "selector":
					             // End of media rule.
					             if (!parentRule) {
						             parseError("Unexpected }");
					             }
					             currentScope.__ends = i + 1;
					             // Nesting rules aren't supported yet
					             styleSheet.cssRules.push(currentScope);
					             currentScope = styleSheet;
					             parentRule = null;
					             buffer = "";
					             state = "before-selector";
					             break;
			                 }
			                 break;

		                 default:
			                 switch (state) {
				             case "before-selector":
					             state = "selector";
					             styleRule = new CSSOM.CSSStyleRule;
					             styleRule.__starts = i;
					             break;
				             case "before-name":
					             state = "name";
					             break;
				             case "before-value":
					             state = "value";
					             break;
				             case "importRule-begin":
					             state = "importRule";
					             break;
			                 }
			                 buffer += character;
			                 break;
		                 }
	                 }

	                 return styleSheet;
                 };


                 //.CommonJS
                 exports.parse = CSSOM.parse;
                 // The following modules cannot be included sooner due to the mutual dependency with parse.js
                 CSSOM.CSSStyleSheet = require("./CSSStyleSheet").CSSStyleSheet;
                 CSSOM.CSSStyleRule = require("./CSSStyleRule").CSSStyleRule;
                 CSSOM.CSSImportRule = require("./CSSImportRule").CSSImportRule;
                 CSSOM.CSSMediaRule = require("./CSSMediaRule").CSSMediaRule;
                 CSSOM.CSSFontFaceRule = require("./CSSFontFaceRule").CSSFontFaceRule;
                 CSSOM.CSSStyleDeclaration = require('./CSSStyleDeclaration').CSSStyleDeclaration;
                 CSSOM.CSSKeyframeRule = require('./CSSKeyframeRule').CSSKeyframeRule;
                 CSSOM.CSSKeyframesRule = require('./CSSKeyframesRule').CSSKeyframesRule;
                 ///CommonJS

             },{"./CSSStyleSheet":15,"./CSSStyleRule":9,"./CSSImportRule":12,"./CSSMediaRule":11,"./CSSFontFaceRule":13,"./CSSStyleDeclaration":7,"./CSSKeyframeRule":17,"./CSSKeyframesRule":16}],19:[function(require,module,exports){
                 //.CommonJS
                 var CSSOM = {
	                 CSSStyleSheet: require("./CSSStyleSheet").CSSStyleSheet,
	                 CSSStyleRule: require("./CSSStyleRule").CSSStyleRule,
	                 CSSMediaRule: require("./CSSMediaRule").CSSMediaRule,
	                 CSSStyleDeclaration: require("./CSSStyleDeclaration").CSSStyleDeclaration,
	                 CSSKeyframeRule: require('./CSSKeyframeRule').CSSKeyframeRule,
	                 CSSKeyframesRule: require('./CSSKeyframesRule').CSSKeyframesRule
                 };
                 ///CommonJS


                 /**
                  * Produces a deep copy of stylesheet — the instance variables of stylesheet are copied recursively.
                  * @param {CSSStyleSheet|CSSOM.CSSStyleSheet} stylesheet
                  * @nosideeffects
                  * @return {CSSOM.CSSStyleSheet}
                  */
                 CSSOM.clone = function clone(stylesheet) {

	                 var cloned = new CSSOM.CSSStyleSheet;

	                 var rules = stylesheet.cssRules;
	                 if (!rules) {
		                 return cloned;
	                 }

	                 var RULE_TYPES = {
		                 1: CSSOM.CSSStyleRule,
		                 4: CSSOM.CSSMediaRule,
		                 //3: CSSOM.CSSImportRule,
		                 //5: CSSOM.CSSFontFaceRule,
		                 //6: CSSOM.CSSPageRule,
		                 8: CSSOM.CSSKeyframesRule,
		                 9: CSSOM.CSSKeyframeRule
	                 };

	                 for (var i=0, rulesLength=rules.length; i < rulesLength; i++) {
		                 var rule = rules[i];
		                 var ruleClone = cloned.cssRules[i] = new RULE_TYPES[rule.type];

		                 var style = rule.style;
		                 if (style) {
			                 var styleClone = ruleClone.style = new CSSOM.CSSStyleDeclaration;
			                 for (var j=0, styleLength=style.length; j < styleLength; j++) {
				                 var name = styleClone[j] = style[j];
				                 styleClone[name] = style[name];
				                 styleClone._importants[name] = style.getPropertyPriority(name);
			                 }
			                 styleClone.length = style.length;
		                 }

		                 if (rule.hasOwnProperty('keyText')) {
			                 ruleClone.keyText = rule.keyText;
		                 }

		                 if (rule.hasOwnProperty('selectorText')) {
			                 ruleClone.selectorText = rule.selectorText;
		                 }

		                 if (rule.hasOwnProperty('mediaText')) {
			                 ruleClone.mediaText = rule.mediaText;
		                 }

		                 if (rule.hasOwnProperty('cssRules')) {
			                 ruleClone.cssRules = clone(rule).cssRules;
		                 }
	                 }

	                 return cloned;

                 };

                 //.CommonJS
                 exports.clone = CSSOM.clone;
                 ///CommonJS

             },{"./CSSStyleSheet":15,"./CSSStyleRule":9,"./CSSMediaRule":11,"./CSSStyleDeclaration":7,"./CSSKeyframeRule":17,"./CSSKeyframesRule":16}]},{},[1])

})
