/**
 * Change this to indicate server has shutdown and is expected to be out of contact. 
 */
var hasShutdown = false;
var polling = false;
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
			   beforeSend: function(request) {
				  request.setRequestHeader("X-Csrf-Token", getCsrfToken());
			   }
			}, options);
	return $.ajax(options);
};

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

/**
 * In case of a reverse proxy let's try to automatically
 * work out what the paths are.
 */
$('script').each(function(idx, script) {
	if($(this).attr('src').length > 0) {
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
    return dateFormat(this, mask, utc);
};

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
				} else if(options[property] != "" && !isNaN(options[property])) {
					options[property] = parseInt(options[property]);
				}
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

$.fn.startSpin = function () {

	if(!$(this).find('.sk-fading-circle').length) {
		$.each($(this).children(), function(idx, element) {
			if($(element).is(":visible")) {
				$(element).data('state', true);
				$(element).hide();
			}
		});
		
		$(this).append('<div class="sk-fading-circle">'
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
				+'</div>');
	}
}

$.fn.stopSpin = function () {

	var me = $(this).find('.sk-fading-circle').parent();
	if(me.length) {
		setTimeout(function() {
			me.find('.sk-fading-circle').remove();
			$.each(me.children(), function(idx, element) {
				if($(element).data('state')) {
					$(element).show();
					$(element).data('state', null);
				}
			});
		    
		}, 500);
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
	loadResourcesUrl('i18n', callback);
}

function loadResourcesUrl(url, callback) {

	getJSON(url, null, function(data) {
		$(document).data('i18n', data);
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
	return value.replace("$" + "{uiPath}", uiPath).replace("$" + "{basePath}", basePath);
}

function getResourceOrDefault(key, alt) {
	var result = $(document).data('i18n')[key];
	if(!result) {
		result = alt;
	}
	return result;
};


function getTooltip(key, element) {
	return getResourceNoDefault(key + '.' + element + '.tooltip');
}

function getResourceNoDefault(key) {
	var result = $(document).data('i18n')[key];
	if(!result) {
		return undefined;
	}
	return result;
};

function getResourceOrText(key) {
	var result = $(document).data('i18n')[key];
	if(!result) {
		return key;
	}
	return result;
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
		if($(this).attr('allowHtml')) {
			$(obj).html(text);
		} else {
			$(obj).text(text);
		}
	});
};

function clearError() {
	$('#highlight').remove();
}

function showError(text, fade, fadeCallback) {
	if(errorFunc) {
		errorFunc(text);
	} else {
		showMessage(text, 'fa-warning', 'alert-danger', typeof fade == 'undefined' ? false : fade, fadeCallback);
	}
}

function showWarning(text, fade, fadeCallback) {
	if(warningFunc) {
		warningFunc(text);
	} else {
		showMessage(text, 'fa-warning', 'alert-warning', typeof fade == 'undefined' ? false : fade, fadeCallback);
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
		$('#systemMessage').fadeOut(2000, function() {
			$('#systemMessage').remove();
			if(fadeCallback) {
				fadeCallback();
			}
		});
	};
	
	if(!element) {
		element = $('body');
	}
	element.prepend('<div id="systemMessage" class="alert ' + alertClass + '" style="position: fixed; top: 0; left: 0; bottom: 0; right: 0; z-index: 1050; height: 50px"/>');
	$('#systemMessage').append('<i class="fa ' + icon + '"></i>&nbsp;&nbsp;<span>' + text + '</span><i id="messageDismiss" class="fa fa-times" style="float: right; cursor: pointer;"></i>');
	
	$('#messageDismiss').click(function() {
		doFade();
	});
	
	if(fade) {
		setTimeout(doFade, 4000);
	}
}

function isFunction(functionToCheck) {
	var getType = {};
	return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

function getJSON(url, params, callback, errorCallback) {
	if(isFunction(url)) {
		url = url();
	}
	if(isFunction(params)) {
		params = params();
	}
	
	log("GET: " + url);
	
	if(!url.startsWith('/') && !url.startsWith('http:') && !url.startsWith('https:')) {
		url = basePath + '/api/' + url;
	}
	
	return doAjax({
		type: "GET",
	    url:  url + (params ? (url.endsWith('?') ? '' : '?') + $.param(params) : ''),
	    cache: false,
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
					showError(getResource("error.cannotContactServer"));
					pollForServerContact();
				} else {
					showError(url + " JSON request failed. [" + xmlRequest.status + "]");
				}
			}
		}
	});
};

function backgroundJSON(url, params, callback) {
	log("GET: " + url);
	
	if(!url.startsWith('/') && !url.startsWith('http:') && !url.startsWith('https:')) {
		url = basePath + '/api/' + url;
	}
	
	return doAjax({
		type: "GET",
	    url:  url + (params ? (url.endsWith('?') ? '' : '?') + $.param(params) : ''),
	    cache: false,
	    dataType: 'json',
	    success: callback
	});
};

function postJSON(url, params, callback, errorCallback, alwaysCallback) {
	
	log("POST: " + url);
	
	if(!url.startsWith('/') && !url.startsWith('http:') && !url.startsWith('https:')) {
		url = basePath + '/api/' + url;
	}
	
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
	
	log("POST FORM: " + url);
	
	if(!url.startsWith('/') && !url.startsWith('http:') && !url.startsWith('https:')) {
		url = basePath + '/api/' + url;
	}
	
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
	
	log("DELETE: " + url);
	
	if(!url.startsWith('/') && !url.startsWith('http:') && !url.startsWith('https:')) {
		url = basePath + '/api/' + url;
	}
	
	return doAjax({
		type: "DELETE",
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

	log("PATCH: " + url);

	if(!url.startsWith('/') && !url.startsWith('http:') && !url.startsWith('https:')) {
		url = basePath + '/api/' + url;
	}

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

function pollForServerContact() {
	
	polling = true;
	doAjax({
		type: "GET",
	    url:  basePath + '/api/session/peek',
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

function isNotGmail(email){
	return validateRegex("^(.(?!@gmail\.com))*$",email);
}

function isReplacementVariable(value) {
	if(typeof value == 'string') {
		return value.trim().startsWith('${') && value.trim().endsWith('}');
	} else {
		return false;
	}
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
	value = value.toString();
	if(value==null) {
		return [];
	}
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
	  var myNav = navigator.userAgent.toLowerCase();
	  return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : false;
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
		$(messageDiv).fadeOut(2000, function() {
			$(messageDiv).remove();
			if(fadeCallback) {
				fadeCallback();
			}
		});
	};
	
	$('#dynamicDashboardMessages').prepend('<div id="dashboardMessage' + messageNum + '" class="alert ' + alertClass + '"/>');
	$(messageDiv).append('<i class="fa ' + icon + '"></i>&nbsp;&nbsp;<span>' + (getResourceNoDefault(text) == undefined ? text : getResource(text)) + '</span><i id="messageDismiss' + messageNum + '" class="fa fa-times" style="float: right; cursor: pointer;"></i>');
	
	$('#messageDismiss' + messageNum).click(function() {
		doFade();
	});
	
	if(fade) {
		setTimeout(doFade, 4000);
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

function getState(name, specific, callback){
	if(Object.prototype.toString.call(name) != '[object Array]') {
		name = [name];
	}
	getJSON('interfaceState/state/' + specific + '/' + name, null, function(data) {
		if(callback){
			callback(data);
		}
	});
}

/**
 * From http://www.w3schools.com/js/js_cookies.asp
 * @param cname
 * @param cvalue
 * @param exdays
 */
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
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

function generateUUID() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
	    return v.toString(16);
	});
}