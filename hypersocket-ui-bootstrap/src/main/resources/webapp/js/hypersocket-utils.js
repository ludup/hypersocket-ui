/**
 * Change this to indicate server has shutdown and is expected to be out of contact. 
 */
var hasShutdown = false;
var polling = false;
var baseUrl = '${baseUrl}';
var basePath = '${appPath}';
var uiPath = '${uiPath}';

var errorFunc;
var successFunc;
var warningFunc;
var infoFunc;

function getCsrfToken() {
	return Cookies.get('HYPERSOCKET_CSRF_TOKEN');
};

function doAjax(options) {
	options = $.extend(
			{  
			   xhrFields: { withCredentials: true },
			   beforeSend: function(request) {
				  request.setRequestHeader("X-Csrf-Token", getCsrfToken());
                  request.setRequestHeader("X-Browser-URL", window.location);
			   }
			}, options);
	return $.ajax(options);
};

function parseQuery(queryString) {
    var query = {};
    var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        query[decodeURIComponent(pair[0])] = decodeURIComponent((pair[1] || '').replaceAll('+','%20'));
    }
    return query;
}

//This is the function.
String.prototype.formatAll = function (args) {
	var str = this.toString();
	return str.replace(String.prototype.formatAll.regex, function(item) {
		var intVal = parseInt(item.substring(1, item.length - 1));
		var replace;
		if (intVal >= 0) {
			replace = args[intVal];
		} else if (intVal === -1) {
			replace = "{";
		} else if (intVal === -2) {
			replace = "}";
		} else {
			replace = "";
		}
		return replace;
	});
};

String.prototype.formatAll.regex = new RegExp("{-?[0-9]+}", "g");

if (!String.prototype.encodeHTML) {
	  String.prototype.encodeHTML = function () {
		var str = this.toString();
	    return str.replace(/&/g, '&amp;')
	               .replace(/</g, '&lt;')
	               .replace(/>/g, '&gt;')
	               .replace(/"/g, '&quot;')
	               .replace(/'/g, '&apos;');
	  };
	}

if (!String.prototype.decodeHTML) {
	  String.prototype.decodeHTML = function () {
		  var str = this.toString();
		    return str.replace(/&apos;/g, "'")
	               .replace(/&quot;/g, '"')
	               .replace(/&gt;/g, '>')
	               .replace(/&lt;/g, '<')
	               .replace(/&amp;/g, '&');
	  };
	}

String.prototype.format = function() {
    var args = arguments;
    var str = this.toString();
    return str.replace(/\{(\d+)\}/g, function() {
        var idx = parseInt(arguments[1]);
        if(Array.isArray(args[0])) {
        	return args[0][idx];
        } else {
        	return args[idx];
        }
    });
};

if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str){
    return this.slice(0, str.length) == str;
  };
}

if (typeof String.prototype.endsWith != 'function') {
  String.prototype.endsWith = function (str){
    return this.slice(-str.length) == str;
  };
}

if (!('contains' in String.prototype)) {
	  String.prototype.contains = function(str, startIndex) {
	    return ''.indexOf.call(this, str, startIndex) !== -1;
	 };
}
if (!Array.from) {
	Array.from = (function() {
		var toStr = Object.prototype.toString;
		var isCallable = function(fn) {
			return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
		};
		var toInteger = function(value) {
			var number = Number(value);
			if (isNaN(number)) {
				return 0;
			}
			if (number === 0 || !isFinite(number)) {
				return number;
			}
			return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
		};
		var maxSafeInteger = Math.pow(2, 53) - 1;
		var toLength = function(value) {
			var len = toInteger(value);
			return Math.min(Math.max(len, 0), maxSafeInteger);
		};

		// The length property of the from method is 1.
		return function from(arrayLike/* , mapFn, thisArg */) {
			// 1. Let C be the this value.
			var C = this;

			// 2. Let items be ToObject(arrayLike).
			var items = Object(arrayLike);

			// 3. ReturnIfAbrupt(items).
			if (arrayLike == null) {
				throw new TypeError("Array.from requires an array-like object - not null or undefined");
			}

			// 4. If mapfn is undefined, then let mapping be false.
			var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
			var T;
			if (typeof mapFn !== 'undefined') {
				// 5. else
				// 5. a If IsCallable(mapfn) is false, throw a TypeError
				// exception.
				if (!isCallable(mapFn)) {
					throw new TypeError('Array.from: when provided, the second argument must be a function');
				}

				// 5. b. If thisArg was supplied, let T be thisArg; else let T
				// be undefined.
				if (arguments.length > 2) {
					T = arguments[2];
				}
			}

			// 10. Let lenValue be Get(items, "length").
			// 11. Let len be ToLength(lenValue).
			var len = toLength(items.length);

			// 13. If IsConstructor(C) is true, then
			// 13. a. Let A be the result of calling the [[Construct]] internal
			// method of C with an argument list containing the single item len.
			// 14. a. Else, Let A be ArrayCreate(len).
			var A = isCallable(C) ? Object(new C(len)) : new Array(len);

			// 16. Let k be 0.
			var k = 0;
			// 17. Repeat, while k < len… (also steps a - h)
			var kValue;
			while (k < len) {
				kValue = items[k];
				if (mapFn) {
					A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
				} else {
					A[k] = kValue;
				}
				k += 1;
			}
			// 18. Let putStatus be Put(A, "length", len, true).
			A.length = len;
			// 20. Return A.
			return A;
		};
	}());
}

/**
 * In case of a reverse proxy let's try to automatically work out what the paths
 * are.
 */
$('script').each(function(idx, script) {
	if($(this).attr('src') && $(this).attr('src').length > 0) {
		if($(this).attr('src').endsWith('hypersocket-utils.js')) {
			var src = $(this).attr('src');
			var idx = 1;
			if(!src.startsWith('/') || src.startsWith('//')) {
				src = src.replace('https://', '');
				src = src.replace('http://', '');
				src = src.replace('//', '');
				idx = src.indexOf('/');
				src = src.substring(idx);
			}
			idx = src.indexOf('/', 1);
			basePath = src.substring(0, idx);
			var idx2 = src.indexOf('/', idx+1);
			uiPath =src.substring(0,idx2);
		}
	}
});


/*
 * Date Format 1.2.3
 * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
 * MIT license
 *
 * Includes enhancements by Scott Trenda <scott.trenda.net>
 * and Kris Kowal <cixar.com/~kris.kowal/>
 *
 * Accepts a date, a mask, or a date and a mask.
 * Returns a formatted version of the given date.
 * The date defaults to the current date/time.
 * The mask defaults to dateFormat.masks.default.
 */

var dateFormat = function () {
    var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
        timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
        timezoneClip = /[^-+\dA-Z]/g,
        pad = function (val, len) {
            val = String(val);
            len = len || 2;
            while (val.length < len) val = "0" + val;
            return val;
        };

    // Regexes and supporting functions are cached through closure
    return function (date, mask, utc) {
        var dF = dateFormat;

        // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
        if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
            mask = date;
            date = undefined;
        }

        // Passing date through Date applies Date.parse, if necessary
        date = date ? new Date(date) : new Date;
        if (isNaN(date)) throw SyntaxError("invalid date");

        mask = String(dF.masks[mask] || mask || dF.masks["default"]);

        // Allow setting the utc argument via the mask
        if (mask.slice(0, 4) == "UTC:") {
            mask = mask.slice(4);
            utc = true;
        }

        var _ = utc ? "getUTC" : "get",
            d = date[_ + "Date"](),
            D = date[_ + "Day"](),
            m = date[_ + "Month"](),
            y = date[_ + "FullYear"](),
            H = date[_ + "Hours"](),
            M = date[_ + "Minutes"](),
            s = date[_ + "Seconds"](),
            L = date[_ + "Milliseconds"](),
            o = utc ? 0 : date.getTimezoneOffset(),
            flags = {
                d:    d,
                dd:   pad(d),
                ddd:  dF.i18n.dayNames[D],
                dddd: dF.i18n.dayNames[D + 7],
                m:    m + 1,
                mm:   pad(m + 1),
                mmm:  dF.i18n.monthNames[m],
                mmmm: dF.i18n.monthNames[m + 12],
                yy:   String(y).slice(2),
                yyyy: y,
                h:    H % 12 || 12,
                hh:   pad(H % 12 || 12),
                H:    H,
                HH:   pad(H),
                M:    M,
                MM:   pad(M),
                s:    s,
                ss:   pad(s),
                l:    pad(L, 3),
                L:    pad(L > 99 ? Math.round(L / 10) : L),
                t:    H < 12 ? "a"  : "p",
                tt:   H < 12 ? "am" : "pm",
                T:    H < 12 ? "A"  : "P",
                TT:   H < 12 ? "AM" : "PM",
                Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
                o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
                S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
            };

        return mask.replace(token, function ($0) {
            return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
        });
    };
}();

// Some common format strings
dateFormat.masks = {
    "default":      "ddd mmm dd yyyy HH:MM:ss",
    shortDate:      "m/d/yy",
    mediumDate:     "mmm d, yyyy",
    longDate:       "mmmm d, yyyy",
    fullDate:       "dddd, mmmm d, yyyy",
    shortTime:      "h:MM TT",
    mediumTime:     "h:MM:ss TT",
    longTime:       "h:MM:ss TT Z",
    isoDate:        "yyyy-mm-dd",
    isoTime:        "HH:MM:ss",
    isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
    isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
};

// Internationalization strings
dateFormat.i18n = {
    dayNames: [
        "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    ],
    monthNames: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
    ]
};

// For convenience...
Date.prototype.format = function (mask, utc) {
	try {
		return dateFormat(this, mask, utc);
	}
	catch(e) {
		return 'Error. ' + e;
	}
};

function formatTime(ms) {
	if (ms < 60000)
		return parseInt(ms / 1000) + 's';
	else if (ms < 120000)
		return '1m ' + parseInt((ms - 60000) / 1000) + 's';
	else if (ms < 3600000)
		return parseInt(ms / 60000) + 'm';
	else if (ms < 7200000)
		return '1h ' + parseInt((ms - 3600000) / 60000) + 'm';
	else
		return parseInt(ms / 3600000) + 'h';
}

function makeVariableSafe(v) {
	if(typeof v == 'string') {
		if(v === 'true') {
			return true;
		} else if(v === 'false') {
			return false;
		} else if(v !== "" && !isNaN(v)) {
			return parseInt(v);
		}
	}
	return v;
}

function makeBooleanSafe(options) {
	
	for(var property in options) {
		if(options.hasOwnProperty(property)) {
			if(typeof options[property] == 'string') {
				if(options[property] == 'true') {
					options[property] = true;
				} else if(options[property] == 'false') {
					options[property] = false;
				} 
//				else if(options[property] != "" && !isNaN(parseFloat(options[property]))) {
//					options[property] = parseFloat(options[property]);
//				} else if(options[property] != "" && !isNaN(parseInt(options[property]))) {
//					options[property] = parseInt(options[property]);
//				}
			}
		}
	}
};

function escapeRegExp(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function replaceAll(string, find, replace) {
  return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

$.fn.insertClass = function(index, classes) {
	var cls = [];
	var cv = $(this).attr('class')
	if(cv) {
		cls = cv.split(' ');
	}
	cls.splice(index, 0, classes.split(' '));
	$(this).attr('class', cls.join(' '));
}

$.fn.getCursorPosition = function () {
    var el = $(this).get(0);
    var pos = 0;
    if ('selectionStart' in el) {
        pos = el.selectionStart;
    } else if ('selection' in document) {
        el.focus();
        var Sel = document.selection.createRange();
        var SelLength = document.selection.createRange().text.length;
        Sel.moveStart('character', -el.value.length);
        pos = Sel.text.length - SelLength;
    }
    return pos;
}

$.fn.startSpin2 = function (message) {
	if(!message)
		message = getResourceOrDefault('pleaseWait.text', "Please wait...");
	var _self = $(this);
	var spins = _self.data('spins');
	if(!spins)
		spins = 0;
	spins++;
	console.log('Starting spinner attached to ' + _self[0].id + ' (' + spins + ')');
	_self.data('spins', spins);
	if(spins == 1) {
		$(this).hide();
		$('<div class="sk-fading-circle"><div class="sk-fading-circle-inner">'
				+'<div class="sk-circle1 sk-circle"></div>'
				+'<div class="sk-circle2 sk-circle"></div>'
				+'<div class="sk-circle3 sk-circle"></div>'
				+'<div class="sk-circle4 sk-circle"></div>'
				+'<div class="sk-circle5 sk-circle"></div>'
				+'<div class="sk-circle6 sk-circle"></div>'
				+'<div class="sk-circle7 sk-circle"></div>'
				+'<div class="sk-circle8 sk-circle"></div>'
				+'<div class="sk-circle9 sk-circle"></div>'
				+'<div class="sk-circle10 sk-circle"></div>'
				+'<div class="sk-circle11 sk-circle"></div>'
				+'<div class="sk-circle12 sk-circle"></div>'
				+'<div class="sk-message"><p>' + message + '</p></div>'
				+'</div></div>').insertBefore(this);
	}
	else
		console.warn('Already attached spinner attached to ' + _self[0].id);
	
	return {
		stopSpin: function() {
			_self.stopSpin();
		}
	};
}

$.fn.startSpin = function (message) {

	if(!message) {
		message = getResource('pleaseWait.text');
	}
	var _self = $(this);
	var spins = _self.data('spins');
	if(!spins)
		spins = 0;
	spins++;
	console.log('Starting spinner attached to ' + _self[0].id + ' (' + spins + ')');
	_self.data('spins', spins);
	if(spins == 1) {
		$('.showOnComplete').hide();
		$(this).hide();
		$('<div class="sk-fading-circle"><div class="sk-fading-circle-inner">'
				+'<div class="sk-circle1 sk-circle"></div>'
				+'<div class="sk-circle2 sk-circle"></div>'
				+'<div class="sk-circle3 sk-circle"></div>'
				+'<div class="sk-circle4 sk-circle"></div>'
				+'<div class="sk-circle5 sk-circle"></div>'
				+'<div class="sk-circle6 sk-circle"></div>'
				+'<div class="sk-circle7 sk-circle"></div>'
				+'<div class="sk-circle8 sk-circle"></div>'
				+'<div class="sk-circle9 sk-circle"></div>'
				+'<div class="sk-circle10 sk-circle"></div>'
				+'<div class="sk-circle11 sk-circle"></div>'
				+'<div class="sk-circle12 sk-circle"></div>'
				+'<div class="sk-message"><p>' + getResourceOrText(message) + '</p></div>'
				+'</div></div>').insertBefore(this);
	}
	else
		console.warn('Already attached spinner attached to ' + _self[0].id);
	
	return {
		stopSpin: function() {
			_self.stopSpin();
		}
	};
}

$.fn.stopSpin = function () {
	var me = $(this).parent().find('.sk-fading-circle').parent();
	var _self = $(this);
	var spins = _self.data('spins');
	if(!spins) {
		console.warn(_self.attr('id') + ' was never started spinning, but we got a request to stop it.');
	}
	else if(spins == 0) {
		console.warn(_self.attr('id') + ' startSpin does not match stopSpin');
	}
	else {
		spins--;
		_self.data('spins', spins);
    	if(spins == 0) {
    		//setTimeout(function() {
    		console.log('Removing spinner attached to ' + _self[0].id);
    		me.find('.sk-fading-circle').remove();
    		$('.showOnComplete').show();
    		_self.show();
    		//}, 100);
    	}
	}
}

$.fn.stopSpin2 = function () {
	var me = $(this).parent().find('.sk-fading-circle').parent();
	var _self = $(this);
	var spins = _self.data('spins');
	if(!spins) {
		console.warn(_self[0].id + ' was never started spinning, but we got a request to stop it.');
	}
	else if(spins == 0) {
		console.warn(_self[0].id + ' startSpin does not match stopSpin');
	}
	else {
		spins--;
		_self.data('spins', spins);
    	if(spins == 0) {
    		//setTimeout(function() {
    			console.log('Removing spinner attached to ' + _self[0].id);
    			me.find('.sk-fading-circle').remove();
    			_self.show();
    		//}, 100);
    	}
	}
}

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
    return results == null ? "" : decodeFormParameter(results[1]);
}

function decodeFormParameter(val) {
	return decodeURIComponent(val.replace(/\+/g, " "));
}

function getAnchorByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\#&]" + name + "=([^&]*)"),
    results = regex.exec(location.hash);
    return results == null ? "" : decodeFormParameter(results[1]);
}

function loadResources(callback) {
	loadResourcesWithGroup('_default_i18n_group', callback);
}

function loadResourcesWithGroup(group, callback) {
	if(!$(document).data('i18n')) {
		var existingCallback = $(document).data('i18n_cb');
		/* The resources might still be loading from a previous call, so we
		   need to add this new callback to run after the previous callback */
		if(callback) {
			if(existingCallback)
				/* Existing callback, so already loading */
				$(document).data('i18n_cb', function() {
					existingCallback();
					callback();
				});
			else {
				$(document).data('i18n_cb', callback);
				doLoadResourcesWithGroup(group);
			}
		}
		else if(!existingCallback)
			doLoadResourcesWithGroup(group);
	} else if(callback) {
		callback();
	}
}

function doLoadResources() {
	doLoadResourcesWithGroup('_default_i18n_group');

};

function doLoadResourcesWithGroup(group) {
	getJSON('i18n/group/' + group, null, function(data) {
		$(document).data('i18n', data);
		var callback = $(document).data('i18n_cb');
		if(callback) {
			callback();
		}
	});

};

function getLogoPath(itype, value, resourceName) {
	var prefix = "logo://";
	if(!value) {
		value = 'logo://32_autotype_autotype_auto.png';
	}
	if(value.slice(0, prefix.length) == prefix) {
		var txt = resourceName;
		if(!txt || txt == '')
			txt = 'Default';
		return basePath + '/api/logo/' + encodeURIComponent(itype) + "/" + encodeURIComponent(txt) + '/' + value.slice(prefix.length);
	}
	else {
		var idx = value.indexOf('/');
		if(idx == -1)
			return basePath + '/api/files/download/' + value;
		else
			return basePath + '/api/' + value;
	}
}

function getResource(key) {
	var result = $(document).data('i18n')[key];
	if(!result) {
		result = "i18n[" + key + "]";
	}
	return result;
};

function replacePaths(value) {
	while(value.indexOf("$" + "{uiPath}") > -1) {
		value = value.replace("$" + "{uiPath}", uiPath);
	}
	while(value.indexOf("$" + "{basePath}") > -1) {
		value = value.replace("$" + "{basePath}", basePath);
	}
	return value;
}

function getResourceOrDefault(key, alt) {
	if($(document).data('i18n')) {
		var result = $(document).data('i18n')[key];
		if(!result) {
			result = alt;
		}
		return result;
	} else {
		return alt;
	}
};


function getTooltip(key, element) {
	return getResourceNoDefault(key + '.' + element + '.tooltip');
}

function getResourceNoDefault(key) {
	if($(document).data('i18n')) {
		var result = $(document).data('i18n')[key];
		if(!result) {
			return undefined;
		}
		return result;
	} else {
		return undefined;
	}
};

function getResourceOrText(key) {
	if($(document).data('i18n')) {
		var result = $(document).data('i18n')[key];
		if(!result) {
			return key;
		}
		return result;
	} else {
		return key;
	}
};

function getResourceWithNamespace(namespace, key) {
	
	var withNamespace = getResourceNoDefault(namespace + '.' + key);
	var withoutNamespace = getResourceNoDefault(key);
	
	if(withNamespace == undefined && withoutNamespace == undefined) {
		return getResource(key);
	} else if(withNamespace != undefined) {
		return replacePaths(withNamespace);
	} else {
		return replacePaths(withoutNamespace);
	}
}

$.fn.localizeTooltip = function() {
	$(this).prop('title', getResource($(this).prop('title')));
	$(this).tooltip();
};

$.fn.localize = function() {

	$('[localize]', '#' + $(this).attr('id')).each(function(i,obj) {
		text = replacePaths(getResource([$(obj).attr('localize')]));
		//if($(this).attr('allowHtml')) {
			$(obj).html(text);
		//} else {
		//	$(obj).text(text);
		//}
	});
};

function legacyjQueryReadyFix(callback) {
    if (document.readyState === 'complete' || 
            (document.readyState !== "loading" && !document.documentElement.doScroll)) {
        callback();
    } else {
        document.addEventListener('DOMContentLoaded', callback);
    }
}

function clearError() {
	$('#highlight').remove();
}

function showError(text, fade, fadeCallback) {
	if(errorFunc) {
		errorFunc(text);
	} else {
		showMessage(text, 'fa-warning', 'alert-danger', typeof fade == 'undefined' ? true : fade, fadeCallback);
	}
}

function showWarning(text, fade, fadeCallback) {
	if(warningFunc) {
		warningFunc(text);
	} else {
		showMessage(text, 'fa-warning', 'alert-warning', typeof fade == 'undefined' ? true : fade, fadeCallback);
	}
}

function showSuccess(text, fade, fadeCallback) {
	if(successFunc) {
		successFunc(text);
	} else {
		showMessage(text, 'fa-warning', 'alert-success', typeof fade == 'undefined' ? true : fade, fadeCallback);
	}
}

function showInformation(text, fade, fadeCallback) {
	if(infoFunc) {
		infoFunc(text);
	} else {
		showMessage(text, 'fa-info', 'alert-info', typeof fade == 'undefined' ? true : fade, fadeCallback);
	}
}

function setupMessaging(error, warn, success, info) {
	errorFunc = error;
	warningFunc = warn;
	successFunc = success;
	infoFunc = info;
}

function removeMessage() {
	$('#systemMessage').remove();
}

function showMessage(text, icon, alertClass, fade, fadeCallback, element) {
	
	text = (getResourceNoDefault(text) == undefined ? text : getResource(text));
	
	log("MESSAGE: " + text);

	removeMessage();
	
	var doFade = function() {
		$('#systemMessage').fadeOut(250, function() {
			$('#systemMessage').remove();
			if(fadeCallback) {
				fadeCallback();
			}
		});
	};
	
	if(!element) {
		element = $('body');
	}
	element.prepend('<div id="systemMessage" class="alert ' + alertClass + '" style="position: fixed; top: 0; left: 0; bottom: 0; right: 0; z-index: 99999; height: 50px; width: 100%;"/>');
	$('#systemMessage').append('<i class="far ' + icon + '"></i>&nbsp;&nbsp;<span>' + text.encodeHTML() + '</span><i id="messageDismiss" class="far fa-times float-right" style="cursor: pointer;"></i>');
	
	$('#messageDismiss').click(function() {
		doFade();
	});
	
	if(fade) {
		setTimeout(doFade, 10000);
	}
}

function isFunction(functionToCheck) {
	var getType = {};
	return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

function resolveUrl(url) {
	if(!url.startsWith('/')) {
		url = basePath + '/api/' + url;
	} 
	if(!url.startsWith('http:') && !url.startsWith('https:')) {
		url = baseUrl + url;
	}
	return url;
}

function getJSON(url, params, callback, errorCallback) {
	if(isFunction(url)) {
		url = url();
	}
	if(isFunction(params)) {
		params = params();
	}

	url = resolveUrl(url);
	
	log("GET: " + url);
	
	return doAjax({
		type: "GET",
	    url:  url + (params ? (url.endsWith('?') ? '' : '?') + $.param(params) : ''),
	    cache: true,
	    dataType: 'json',
	    success: callback
	}).fail(function(xmlRequest) {
		if(xmlRequest.status==200) {
			// Simply no content
			callback();
			return;
		}
		if(errorCallback) {
			if(!errorCallback(xmlRequest)) {
				return;
			}
		}
		if (xmlRequest.status != 401) {
			if(!hasShutdown) {
				if(xmlRequest.status == 0) {
					showError(getResourceOrDefault("error.cannotContactServer", "Cannot contact server"));
					pollForServerContact();
				} else {
					showError(url + " JSON request failed. [" + xmlRequest.status + "]");
				}
			}
		}
	});
};

function backgroundJSON(url, params, callback) {
	
	
	url = resolveUrl(url);
	
	log("GET: " + url);
	
	return doAjax({
		type: "GET",
	    url:  url + (params ? (url.endsWith('?') ? '' : '?') + $.param(params) : ''),
	    cache: false,
	    dataType: 'json',
	    success: callback
	});
};

function postJSON(url, params, callback, errorCallback, alwaysCallback) {
	

	url = resolveUrl(url);
	
	log("POST: " + url);
	
	return doAjax({
		type: "POST",
	    url:  url,
	    dataType: 'json',
	    contentType: 'application/json',
	    data: JSON.stringify(params),
	    success: callback
	}).fail(function(xmlRequest) {
		if(xmlRequest.status==200) {
			// Simply no content
			callback();
			return;
		}
		if(errorCallback) {
			if(!errorCallback()) {
				return;
			}
		}
		if (xmlRequest.status != 401) {
			if(!hasShutdown) {
				if(xmlRequest.status == 0) {
					showError(getResource("error.cannotContactServer"));
					pollForServerContact();
				} else {
					showError(url + " JSON request failed. [" + xmlRequest.status + "]");
				}
			}
		}
	}).always(function() {
		if(alwaysCallback) {
			alwaysCallback();
		}
	});
	
};

function postFORM(url, params, callback, errorCallback, alwaysCallback) {
	
	url = resolveUrl(url);
	
	log("POST FORM: " + url);
	
	return doAjax({
		type: "POST",
	    url:  url,
	    dataType: 'json',
	    contentType: 'application/x-www-form-urlencoded',
	    data: params,
	    success: callback
	}).fail(function(xmlRequest) {
		if(xmlRequest.status==200) {
			// Simply no content
			callback();
			return;
		}
		if(errorCallback) {
			if(!errorCallback()) {
				return;
			}
		}
		if (xmlRequest.status != 401) {
			if(!hasShutdown) {
				if(xmlRequest.status == 0) {
					showError(getResource("error.cannotContactServer"));
					pollForServerContact();
				} else {
					showError(url + " JSON request failed. [" + xmlRequest.status + "]");
				}
			}
		}
	}).always(function() {
		if(alwaysCallback) {
			alwaysCallback();
		}
	});
	
};

function deleteJSON(url, params, callback, errorCallback) {

	
	url = resolveUrl(url);

	log("DELETE: " + url);
	
	return doAjax({
		type: "DELETE",
	    url:  url,
	    dataType: 'json',
	    contentType: 'application/json',
	    data: JSON.stringify(params),
	    success: callback
	}).fail(function(xmlRequest) {
		if(errorCallback) {
			if(!errorCallback(xmlRequest)) {
				return;
			}
		}
		if (xmlRequest.status != 401) {
			if(hasShutdown) {
				if(xmlRequest.status == 0) {
					showError(getResource("error.cannotContactServer"));
					pollForServerContact();
				} else {
					showError(url + " JSON request failed. [" + xmlRequest.status + "]");
				}
			}
		}
	});
};


function patchJSON(url, params, callback, errorCallback, alwaysCallback) {

	
	url = resolveUrl(url);
	
	log("PATCH: " + url);
	

	return doAjax({
		type: "PATCH",
	    url:  url,
	    dataType: 'json',
	    contentType: 'application/json',
	    data: JSON.stringify(params),
	    success: callback
	}).fail(function(xmlRequest) {
		if(errorCallback) {
			if(!errorCallback()) {
				return;
			}
		}
		if (xmlRequest.status != 401) {
			if(!hasShutdown) {
				if(xmlRequest.status == 0) {
					showError(getResource("error.cannotContactServer"));
					pollForServerContact();
				} else {
					showError(url + " JSON request failed. [" + xmlRequest.status + "]");
				}
			}
		}
	}).always(function() {
		if(alwaysCallback) {
			alwaysCallback();
		}
	});

};

function loadContent(selector, url, successCb, failCb) {
	doAjax({
		type: "GET",
	  	url: url       
	})
	.done(function(data) {
		$(selector).html(data);
		if (successCb) {
			successCb(data);
		}
	})
	.fail(function(err) {
		if (failCb) {
			failCb(err);
		}
	});
}

function pollForServerContact() {
	
	polling = true;
	doAjax({
		type: "GET",
	    url:  baseUrl + basePath + '/api/session/peek',
	    dataType: 'json',
	    contentType: 'application/json',
	    success: function() {
	    	showInformation(getResource('info.serverIsBack'), true, function() {
	    		polling = false;
	    		window.location.reload();	
	    	});
	    	
	    }
	}).fail(function(xmlRequest) {
		if(xmlRequest.status==401) {
			showInformation(getResource('info.serverIsBack'), true, function() {
	    		polling = false;
	    		window.location.reload();	
	    	});
		} else {
			setTimeout(pollForServerContact, 1000);
		}
	});
	
}
function msgBox(data) {
	
	var $msgbox = $('<div id=\"msgbox\" title=\"' + data.title + '\"><p>' + data.message + '</p></div>');
	$msgbox.dialog( {
		autoOpen: true,
	    height: "auto",
	    width: "auto",
	    modal: true,
	    buttons: {
	       "OK" : function() {
	        	  $(this).dialog('close');
	        }
	      }
	});
};

function confirmBox(data) {
	
	log("Showing confirmBox: title=" + data.title + " message=" + data.message);
	
	var $confirmbox = $('<div id=\"confirmbox\" title=\"' + data.title + '\"><p>' + data.message + '</p></div>');
	$confirmbox.dialog( {
		autoOpen: true,
	    height: "auto",
	    width: "auto",
	    modal: true,
	    buttons: {
	       "OK" : function() {
	    	   	  log("OK pressed: title=" + data.title + " message=" + data.message);
	        	  data.callback();
	        	  $(this).dialog('close');
	        },
	        "Cancel" : function() {
	        	log("Cancel pressed: title=" + data.title + " message=" + data.message);
	        	if(data.cancel) {
	        		data.cancel();
	        	}
	        	$(this).dialog('close');
	        }
	      }
	});
};

$.fn.hypersocketError = function(resourceKey) {
	createMessageDiv($(this), resourceKey, 'ui-icon-alert');
};

$.fn.hypersocketInfo = function(resourceKey) {
	createMessageDiv($(this), resourceKey, 'ui-icon-info');
};


function createMessageDiv(div, resourceKey, icon) {
	$('#dialogErrorHighlight' + div.attr('id'), div).remove();
	
	if(resourceKey!='reset') {
	 	div.append('<div id="dialogErrorHighlight'  + div.attr('id') + '" class="alert alert-danger"/>');
			$('#dialogErrorHighlight' + div.attr('id')).append('<span class="ui-icon ' + icon + '\"></span><span>' 
					+ (getResource(resourceKey)==undefined ? resourceKey : getResource(resourceKey))
					+ '</span>');
	}
};


function isValidHostname(hostname) {
	var hostnameRegex = "^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$";
	return hostname.search(hostnameRegex)==0;
}

function isValidIpv4Address(address) {
	var ipAddressRegex = "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$";
	return address.search(ipAddressRegex)==0;
}

function isValidIpv6Address(address) {
	var ipv6AddressRegex = "^((([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}:[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){5}:([0-9A-Fa-f]{1,4}:)?[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){4}:([0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){3}:([0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){2}:([0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|(([0-9A-Fa-f]{1,4}:){0,5}:((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|(::([0-9A-Fa-f]{1,4}:){0,5}((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|([0-9A-Fa-f]{1,4}::([0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})|(::([0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){1,7}:))$";
	return address.search(ipv6AddressRegex)==0;
}

function isValidURL(url) {
	var urlRegex = "^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$";
	return url.search(urlRegex) == 0;
}

function isValidEmail(email){
	return validateRegex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",email);
}

function isValidCIDR(cdir){
	return validateRegex("^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(/([0-9]|[1-2][0-9]|3[0-2]))$",cdir);
}

function isAlphaNumeric(val) {
	return validateRegex("^[0-9a-z]+$", val);
}

function isNotGmail(email){
	return validateRegex("^(.(?!@gmail\.com))*$",email);
}

function validateRegex(regex,value){
	if(value) {
		var patt = new RegExp(regex) ;
		return patt.test(value);
	} else {
		return false;
	}
}

function isReplacementVariable(value) {
	if(typeof value == 'string') {
		return value.trim().startsWith('${') && value.trim().endsWith('}');
	} else {
		return false;
	}
}

function containsReplacement(value) {
	if(typeof value == 'string') {
		return value.trim().indexOf('${') > -1 && value.trim().indexOf('}') > value.trim().indexOf('${');
	} else {
		return false;
	}
}

function startSpin(element, iconClass) {
	element.removeClass(iconClass);
	element.addClass('fa-spin');
	element.addClass('fa-spinner');
	element.parent().attr('disabled', true);
}

function stopSpin(element, iconClass) {
	element.removeClass('fa-spin');
	element.removeClass('fa-spinner');
	element.addClass(iconClass);
	element.parent().attr('disabled', false);
}

function getVariableName(value) {
	return value.trim().substring(2, value.trim().length - 1);
}

function looksLikeMail(str) {
    var lastAtPos = str.lastIndexOf('@');
    var lastDotPos = str.lastIndexOf('.');
    return (lastAtPos < lastDotPos && lastAtPos > 0 && str.indexOf('@@') == -1 && lastDotPos > 2 && (str.length - lastDotPos) > 2);
}

function splitFix(value) {
	if(value==null) {
		return [];
	}
	value = value.toString();
	var result = value.split(']|[');
	if (result.length == 1) {
		if (result[0] == "") {
			return [];
		}
	}
	return result;
}

function splitNamePairs(value, nameAttr, valueAttr) {
	
	var values = splitFix(value);
	var result = new Array();
	$.each(values, function(idx, obj) {
		v = obj.split('=');
		if(!valueAttr)
			valueAttr = 'value';
		if(!nameAttr)
			nameAttr = 'name';
		var o = {};
		o[valueAttr] = v[0];
		o[nameAttr] = decodeURIComponent(v[1]);
		result.push(o);
	});
	return result;
}

function formatBytes(bytes,decimals) {
	   if(bytes == 0) return '0 B';
	   var k = 1000; // or 1024 for binary
	   var dm = decimals + 1 || 3;
	   var sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	   var i = Math.floor(Math.log(bytes) / Math.log(k));
	   return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function fixSplit(value) {
	return value ? value.join(']|[') : '';
}

function log(str) {
	if(!window.console) {
		return;
	}
	window.console.log(str);
}

function stripNull(str) {
	return str==null ? "" : str;
}

function isIE () {

    var ua = window.navigator.userAgent;

    var msie = ua.indexOf('MSIE ');
    if (msie > 0) {
        // IE 10 or older => return version number
        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }

    var trident = ua.indexOf('Trident/');
    if (trident > 0) {
        // IE 11 => return version number
        var rv = ua.indexOf('rv:');
        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }

    // other browser
    return false;
}

function stripFragment(url) {
	
	var idx = url.indexOf('#');
	if(idx > -1) {
		return url.substring(0, idx);
	}
	return url;
}

function formatResourceKey(resourceKey){
	return resourceKey.split('.').join('_') ;
}

function isDashboardVisible() {
	return $('#dynamicDashboardMessages').length > 0;
}

function showDashboardMessage(text, icon, alertClass, fade, fadeCallback) {
	log("DASHBOARD: " + text);

	var messageNum = $('#dynamicDashboardMessages').length;
	var messageDiv = '#dashboardMessage' + messageNum;
	
	var doFade = function() {
		$(messageDiv).fadeOut(250, function() {
			$(messageDiv).remove();
			if(fadeCallback) {
				fadeCallback();
			}
		});
	};
	
	$('#dynamicDashboardMessages').prepend('<div id="dashboardMessage' + messageNum + '" class="alert ' + alertClass + '"/>');
	$(messageDiv).append('<i class="far ' + icon + '"></i>&nbsp;&nbsp;<span>' + (getResourceNoDefault(text) == undefined ? text : getResource(text)) + '</span></i>');
	
	if(fade) {
		setTimeout(doFade, 10000);
	}
}

function showDashboardError(text, fade, fadeCallback) {
	showDashboardMessage(text, 'fa-warning', 'alert-danger', typeof fade == 'undefined' ? false : fade, fadeCallback);
}

function showDashboardWarning(text, fade, fadeCallback) {
	showDashboardMessage(text, 'fa-warning', 'alert-warning', typeof fade == 'undefined' ? false : fade, fadeCallback);
}

function showDashboardSuccess(text, fade, fadeCallback) {
	showDashboardMessage(text, 'fa-warning', 'alert-success', typeof fade == 'undefined' ? true : fade, fadeCallback);
}

function showDashboardInformation(text, fade, fadeCallback) {
	showDashboardMessage(text, 'fa-info', 'alert-info', typeof fade == 'undefined' ? true : fade, fadeCallback);
}

function fadeMessage(fadeCallback) {
	$('#systemMessage').fadeOut(2000, function() {
		$('#systemMessage').remove();
		if(fadeCallback) {
			fadeCallback();
		}
	});
}

function doNotDisplayIfNotEnabled(resource, menu) {
	return menu.enabled;
}

function saveState(name, preferences, specific, callback){
	var state = {'name': name, 'specific': specific, 'preferences': JSON.stringify(preferences)};
	postJSON('interfaceState/state', state, function(data) {
		if(callback){
			callback(data);
		}
	});
}

function saveNonJsonState(name, preferences, specific, callback){
	var state = {'name': name, 'specific': specific, 'preferences': preferences};
	postJSON('interfaceState/state', state, function(data) {
		if(callback){
			callback(data);
		}
	});
}


function getState(name, specific, callback){
	if(Object.prototype.toString.call(name) != '[object Array]') {
		name = [name];
	}
	getJSON('interfaceState/state/' + specific + '/' + name, null, function(data) {
		if(callback){
		    var prefs = {};
		    if(data && data.resources && data.resources[0]) {
				try {
		    		prefs = JSON.parse(data.resources[0].preferences);
		    	}
		    	catch(e) {
				} 
		    }	
			callback(data, prefs);
		}
	});
}

/**
 * From http://www.w3schools.com/js/js_cookies.asp
 * @param cname
 * @param cvalue
 * @param exdays
 */
function setCookie(cname, cvalue, exdays, path) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    if(!path) {
    	path = '/';
    }
    document.cookie = cname + "=" + cvalue + "; path=" + path + "; " + expires;
   
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function checkElementHasId(el) {
	var eid = $(el).attr('id');
	if(!eid)
		$(el).attr('id', generateUUID().replace('-',''));
	return el;
}

function generateUUID() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
	    return v.toString(16);
	});
}

function msToTime(duration, showMs) {
	var milliseconds = parseInt((duration % 1000)), seconds = Math.floor((duration / 1000) % 60), minutes = Math.floor((duration / (1000 * 60)) % 60), hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
	var hourss = (hours < 10) ? "0" + hours : hours;
	var minutess = (minutes < 10) ? "0" + minutes : minutes;
	var secondss = (seconds < 10) ? "0" + seconds : seconds;
	return ( hours > 0 ? hourss + "h " : '') + ( minutes > 0 ? minutess + "m " : '') + ( secondss > 0 ? secondss + "s " : '') + ( showMs ? milliseconds + 'ms' : '');
}


var ByteArrayReader = function ByteArrayReader(data) {
	this.pos = 0;
	this.data = data;
};

ByteArrayReader.prototype.readLong = function() {
	var val = this.data.getUint32(this.pos);
	this.pos += 4;
	return val;
}

ByteArrayReader.prototype.readString = function() {
	
	var len = this.data.getUint32(this.pos);
	this.pos += 4;
	
	var buf = new Uint8Array(this.data.buffer, this.pos, len);
	this.pos += len;
	return new TextDecoder("utf8").decode(buf);
};

function NotificationInitHelper(){ 
	this.funcs = [];
	this.position = undefined;
	this.remoteCalled = false;
	
	this.setUp = function(_fun, text) {
		if (!this.position) {
			this.funcs.push({f: _fun, d: text});
			if (!this.remoteCalled) {
				this.remoteCalled = true;
				const that = this;
				getJSON("brand/notification", null, function(data) {
						if (data && data.success && data.resource) {
							that.position = data.resource.position;
							log("The notify position is (remote pulled) " + that.position);
							for(let i = 0; i < that.funcs.length; ++i) {
								const f = that.funcs[i];
								f.f(f.d, that.position);
							}
						}
					},
					function (xmlRequest) {
						log("There was error requesting setting from server, using defaults, status code = " + xmlRequest.status);
						that.position = "right bottom";
						_fun(text, that.position);
					}
				);
			}
		} else {
			log("The notify position is " + this.position);
			_fun(text, this.position);
		}
		
	};
}

const notificationInitHelper = new NotificationInitHelper();



function showAuditError(text) {
	
	if($(document).data('lastError') === 'error.cannotContactServer' && text === 'error.cannotContactServer') {
		return;
	}
	$(document).data('lastError', text);
	loadResources(function() {
		text = (getResourceNoDefault(text) == undefined ? text.encodeHTML() : getResource(text).encodeHTML());
		if(!text) {
			text = 'Undefined error message';
		}
		
		notificationInitHelper.setUp(function(_text, _position) {
			$.notify(_text, { arrowShow: false, className: 'error', 
			position: _position, autoHideDelay: 7500, style: 'hypersocket'});
		}, text);	
	});
}

function showAuditWarning(text) {
	loadResources(function() {
		text = (getResourceNoDefault(text) == undefined ? text.encodeHTML() : getResource(text).encodeHTML());
		
		notificationInitHelper.setUp(function(_text, _position) {
			$.notify(_text, { arrowShow: false, className: 'warn', 
			position: _position, autoHideDelay: 7500, style: 'hypersocket'});	
		}, text);	
	});

}

function showAuditSuccess(text) {
	loadResources(function() {
		
		if(text) {
			text = (getResourceNoDefault(text) == undefined ? text.encodeHTML() : getResource(text).encodeHTML());
		}
		notificationInitHelper.setUp(function(_text, _position) {
			$.notify(_text, { arrowShow: false, className: 'success', 
			position: _position, autoHideDelay: 7500, style: 'hypersocket'});
		}, text);
		
		
		
	});
}

function showAuditInfo(text) {
	loadResources(function() {
		if(text) {
			text = (getResourceNoDefault(text) == undefined ? text.encodeHTML() : getResource(text).encodeHTML());
		}
		notificationInitHelper.setUp(function(_text, _position) {
			$.notify(_text, { arrowShow: false, className: 'info', 
			position: _position, autoHideDelay: 7500, style: 'hypersocket'});
		}, text);
	});
}

function cleanValue(obj) {
	if (typeof obj === "string") {
		return he.escape(obj);
	}
	
	return obj;
}

legacyjQueryReadyFix(function() {
	$.notify.addStyle("hypersocket", {
		html: "<div>\n<span data-notify-html></span>\n</div>",
		classes: {
			base: {
				"font-weight": "bold",
				"padding": "8px 15px 8px 15px",
				"text-shadow": "0 1px 0 rgba(255, 255, 255, 0.5)",
				"background-color": "#fcf8e3",
				"border": "1px solid #fbeed5",
				"border-radius": "0px",
				"white-space": "nowrap",
				"padding-left": "25px",
				"background-repeat": "no-repeat",
				"background-position": "3px 7px"
			},
			error: {
				"color": "#B94A48",
				"background-color": "#F2DEDE",
				"border-color": "#EED3D7",
				"background-image": "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAtRJREFUeNqkVc1u00AQHq+dOD+0poIQfkIjalW0SEGqRMuRnHos3DjwAH0ArlyQeANOOSMeAA5VjyBxKBQhgSpVUKKQNGloFdw4cWw2jtfMOna6JOUArDTazXi/b3dm55socPqQhFka++aHBsI8GsopRJERNFlY88FCEk9Yiwf8RhgRyaHFQpPHCDmZG5oX2ui2yilkcTT1AcDsbYC1NMAyOi7zTX2Agx7A9luAl88BauiiQ/cJaZQfIpAlngDcvZZMrl8vFPK5+XktrWlx3/ehZ5r9+t6e+WVnp1pxnNIjgBe4/6dAysQc8dsmHwPcW9C0h3fW1hans1ltwJhy0GxK7XZbUlMp5Ww2eyan6+ft/f2FAqXGK4CvQk5HueFz7D6GOZtIrK+srupdx1GRBBqNBtzc2AiMr7nPplRdKhb1q6q6zjFhrklEFOUutoQ50xcX86ZlqaZpQrfbBdu2R6/G19zX6XSgh6RX5ubyHCM8nqSID6ICrGiZjGYYxojEsiw4PDwMSL5VKsC8Yf4VRYFzMzMaxwjlJSlCyAQ9l0CW44PBADzXhe7xMdi9HtTrdYjFYkDQL0cn4Xdq2/EAE+InCnvADTf2eah4Sx9vExQjkqXT6aAERICMewd/UAp/IeYANM2joxt+q5VI+ieq2i0Wg3l6DNzHwTERPgo1ko7XBXj3vdlsT2F+UuhIhYkp7u7CarkcrFOCtR3H5JiwbAIeImjT/YQKKBtGjRFCU5IUgFRe7fF4cCNVIPMYo3VKqxwjyNAXNepuopyqnld602qVsfRpEkkz+GFL1wPj6ySXBpJtWVa5xlhpcyhBNwpZHmtX8AGgfIExo0ZpzkWVTBGiXCSEaHh62/PoR0p/vHaczxXGnj4bSo+G78lELU80h1uogBwWLf5YlsPmgDEd4M236xjm+8nm4IuE/9u+/PH2JXZfbwz4zw1WbO+SQPpXfwG/BBgAhCNZiSb/pOQAAAAASUVORK5CYII=)"
			},
			success: {
				"color": "#468847",
				"background-color": "#DFF0D8",
				"border-color": "#D6E9C6",
				"background-image": "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAutJREFUeNq0lctPE0Ecx38zu/RFS1EryqtgJFA08YCiMZIAQQ4eRG8eDGdPJiYeTIwHTfwPiAcvXIwXLwoXPaDxkWgQ6islKlJLSQWLUraPLTv7Gme32zoF9KSTfLO7v53vZ3d/M7/fIth+IO6INt2jjoA7bjHCJoAlzCRw59YwHYjBnfMPqAKWQYKjGkfCJqAF0xwZjipQtA3MxeSG87VhOOYegVrUCy7UZM9S6TLIdAamySTclZdYhFhRHloGYg7mgZv1Zzztvgud7V1tbQ2twYA34LJmF4p5dXF1KTufnE+SxeJtuCZNsLDCQU0+RyKTF27Unw101l8e6hns3u0PBalORVVVkcaEKBJDgV3+cGM4tKKmI+ohlIGnygKX00rSBfszz/n2uXv81wd6+rt1orsZCHRdr1Imk2F2Kob3hutSxW8thsd8AXNaln9D7CTfA6O+0UgkMuwVvEFFUbbAcrkcTA8+AtOk8E6KiQiDmMFSDqZItAzEVQviRkdDdaFgPp8HSZKAEAL5Qh7Sq2lIJBJwv2scUqkUnKoZgNhcDKhKg5aH+1IkcouCAdFGAQsuWZYhOjwFHQ96oagWgRoUov1T9kRBEODAwxM2QtEUl+Wp+Ln9VRo6BcMw4ErHRYjH4/B26AlQoQQTRdHWwcd9AH57+UAXddvDD37DmrBBV34WfqiXPl61g+vr6xA9zsGeM9gOdsNXkgpEtTwVvwOklXLKm6+/p5ezwk4B+j6droBs2CsGa/gNs6RIxazl4Tc25mpTgw/apPR1LYlNRFAzgsOxkyXYLIM1V8NMwyAkJSctD1eGVKiq5wWjSPdjmeTkiKvVW4f2YPHWl3GAVq6ymcyCTgovM3FzyRiDe2TaKcEKsLpJvNHjZgPNqEtyi6mZIm4SRFyLMUsONSSdkPeFtY1n0mczoY3BHTLhwPRy9/lzcziCw9ACI+yql0VLzcGAZbYSM5CCSZg1/9oc/nn7+i8N9p/8An4JMADxhH+xHfuiKwAAAABJRU5ErkJggg==)"
			},
			info: {
				"color": "#3A87AD",
				"background-color": "#D9EDF7",
				"border-color": "#BCE8F1",
				"background-image": "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3QYFAhkSsdes/QAAA8dJREFUOMvVlGtMW2UYx//POaWHXg6lLaW0ypAtw1UCgbniNOLcVOLmAjHZolOYlxmTGXVZdAnRfXQm+7SoU4mXaOaiZsEpC9FkiQs6Z6bdCnNYruM6KNBw6YWewzl9z+sHImEWv+vz7XmT95f/+3/+7wP814v+efDOV3/SoX3lHAA+6ODeUFfMfjOWMADgdk+eEKz0pF7aQdMAcOKLLjrcVMVX3xdWN29/GhYP7SvnP0cWfS8caSkfHZsPE9Fgnt02JNutQ0QYHB2dDz9/pKX8QjjuO9xUxd/66HdxTeCHZ3rojQObGQBcuNjfplkD3b19Y/6MrimSaKgSMmpGU5WevmE/swa6Oy73tQHA0Rdr2Mmv/6A1n9w9suQ7097Z9lM4FlTgTDrzZTu4StXVfpiI48rVcUDM5cmEksrFnHxfpTtU/3BFQzCQF/2bYVoNbH7zmItbSoMj40JSzmMyX5qDvriA7QdrIIpA+3cdsMpu0nXI8cV0MtKXCPZev+gCEM1S2NHPvWfP/hL+7FSr3+0p5RBEyhEN5JCKYr8XnASMT0xBNyzQGQeI8fjsGD39RMPk7se2bd5ZtTyoFYXftF6y37gx7NeUtJJOTFlAHDZLDuILU3j3+H5oOrD3yWbIztugaAzgnBKJuBLpGfQrS8wO4FZgV+c1IxaLgWVU0tMLEETCos4xMzEIv9cJXQcyagIwigDGwJgOAtHAwAhisQUjy0ORGERiELgG4iakkzo4MYAxcM5hAMi1WWG1yYCJIcMUaBkVRLdGeSU2995TLWzcUAzONJ7J6FBVBYIggMzmFbvdBV44Corg8vjhzC+EJEl8U1kJtgYrhCzgc/vvTwXKSib1paRFVRVORDAJAsw5FuTaJEhWM2SHB3mOAlhkNxwuLzeJsGwqWzf5TFNdKgtY5qHp6ZFf67Y/sAVadCaVY5YACDDb3Oi4NIjLnWMw2QthCBIsVhsUTU9tvXsjeq9+X1d75/KEs4LNOfcdf/+HthMnvwxOD0wmHaXr7ZItn2wuH2SnBzbZAbPJwpPx+VQuzcm7dgRCB57a1uBzUDRL4bfnI0RE0eaXd9W89mpjqHZnUI5Hh2l2dkZZUhOqpi2qSmpOmZ64Tuu9qlz/SEXo6MEHa3wOip46F1n7633eekV8ds8Wxjn37Wl63VVa+ej5oeEZ/82ZBETJjpJ1Rbij2D3Z/1trXUvLsblCK0XfOx0SX2kMsn9dX+d+7Kf6h8o4AIykuffjT8L20LU+w4AZd5VvEPY+XpWqLV327HR7DzXuDnD8r+ovkBehJ8i+y8YAAAAASUVORK5CYII=)"
			},
			warn: {
				"color": "#C09853",
				"background-color": "#FCF8E3",
				"border-color": "#FBEED5",
				"background-image": "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAABJlBMVEXr6eb/2oD/wi7/xjr/0mP/ykf/tQD/vBj/3o7/uQ//vyL/twebhgD/4pzX1K3z8e349vK6tHCilCWbiQymn0jGworr6dXQza3HxcKkn1vWvV/5uRfk4dXZ1bD18+/52YebiAmyr5S9mhCzrWq5t6ufjRH54aLs0oS+qD751XqPhAybhwXsujG3sm+Zk0PTwG6Shg+PhhObhwOPgQL4zV2nlyrf27uLfgCPhRHu7OmLgAafkyiWkD3l49ibiAfTs0C+lgCniwD4sgDJxqOilzDWowWFfAH08uebig6qpFHBvH/aw26FfQTQzsvy8OyEfz20r3jAvaKbhgG9q0nc2LbZxXanoUu/u5WSggCtp1anpJKdmFz/zlX/1nGJiYmuq5Dx7+sAAADoPUZSAAAAAXRSTlMAQObYZgAAAAFiS0dEAIgFHUgAAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQfdBgUBGhh4aah5AAAAlklEQVQY02NgoBIIE8EUcwn1FkIXM1Tj5dDUQhPU502Mi7XXQxGz5uVIjGOJUUUW81HnYEyMi2HVcUOICQZzMMYmxrEyMylJwgUt5BljWRLjmJm4pI1hYp5SQLGYxDgmLnZOVxuooClIDKgXKMbN5ggV1ACLJcaBxNgcoiGCBiZwdWxOETBDrTyEFey0jYJ4eHjMGWgEAIpRFRCUt08qAAAAAElFTkSuQmCC)"
			}
		}
	});
	
	loadResources(function() {
		setupMessaging(showAuditError, showAuditWarning, showAuditSuccess, showAuditInfo);
	});
});