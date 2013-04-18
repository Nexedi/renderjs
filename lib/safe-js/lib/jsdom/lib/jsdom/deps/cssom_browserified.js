define([], function(){return (function(e,t,n){function r(n,i){if(!t[n]){if(!e[n]){var s=typeof require=="function"&&require;if(!i&&s)return s(n,!0);throw new Error("Cannot find module '"+n+"'")}var o=t[n]={exports:{}};e[n][0](function(t){var i=e[n][1][t];return r(i?i:t)},o,o.exports)}return t[n].exports}
                                              for(var i=0;i<n.length;i++)
                                                  r(n[i]);
                                              var myexps = {};

                                              for(var i in t) {
                                                  for(var j in t[i].exports){
                                                      myexps[j] = t[i].exports[j]
                                                  }
                                              };
                                              
                                              return myexps;

                                             })({1:[function(require,module,exports){
                                                 var cssom = require('cssom');

                                             },{"cssom":2}],2:[function(require,module,exports){
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

                                             },{"./CSSStyleDeclaration":3,"./CSSRule":4,"./CSSStyleRule":5,"./MediaList":6,"./CSSMediaRule":7,"./CSSImportRule":8,"./CSSFontFaceRule":9,"./StyleSheet":10,"./CSSStyleSheet":11,"./CSSKeyframesRule":12,"./CSSKeyframeRule":13,"./parse":14,"./clone":15}],4:[function(require,module,exports){
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

                                             },{}],6:[function(require,module,exports){
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

                                             },{}],10:[function(require,module,exports){
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

                                             },{}],3:[function(require,module,exports){
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

                                             },{"./parse":14}],5:[function(require,module,exports){
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

                                             },{"./CSSStyleDeclaration":3,"./CSSRule":4}],7:[function(require,module,exports){
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

                                             },{"./CSSRule":4,"./MediaList":6}],8:[function(require,module,exports){
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

                                             },{"./CSSRule":4,"./CSSStyleSheet":11,"./MediaList":6}],9:[function(require,module,exports){
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

                                             },{"./CSSStyleDeclaration":3,"./CSSRule":4}],11:[function(require,module,exports){
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

                                             },{"./StyleSheet":10,"./CSSStyleRule":5,"./parse":14}],12:[function(require,module,exports){
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

                                             },{"./CSSRule":4}],13:[function(require,module,exports){
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

                                             },{"./CSSRule":4,"./CSSStyleDeclaration":3}],14:[function(require,module,exports){
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

                                             },{"./CSSStyleSheet":11,"./CSSStyleRule":5,"./CSSImportRule":8,"./CSSMediaRule":7,"./CSSFontFaceRule":9,"./CSSStyleDeclaration":3,"./CSSKeyframeRule":13,"./CSSKeyframesRule":12}],15:[function(require,module,exports){
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

                                             },{"./CSSStyleSheet":11,"./CSSStyleRule":5,"./CSSMediaRule":7,"./CSSStyleDeclaration":3,"./CSSKeyframeRule":13,"./CSSKeyframesRule":12}]},{},[1])

                     })
