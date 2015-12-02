/**
 * Change this to indicate server has shutdown and is expected to be out of contact. 
 */
var hasShutdown = false;
var polling = false;
var regex = new RegExp(/(.[^\:]+)(\:\/\/)(.[^\/]+)(.[^\/]+)(.[^\/]+)(.*)/);

var url = regex.exec(document.URL);
var baseURL = url[1] + url[2] + url[3] + url[4];
var basePath = url[4];
var uiPath = basePath + '/ui/';

String.prototype.format = function() {
    var args = arguments;

    return this.replace(/\{(\d+)\}/g, function() {
        return args[arguments[1]];
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

function makeBooleanSafe(options) {
	for(var property in options) {
		log(property);
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

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
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

function getResource(key) {
	var result = $(document).data('i18n')[key];
	if(!result) {
		result = "i18n[" + key + "]";
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
		return withNamespace;
	} else {
		return withoutNamespace;
	}
}

$.fn.localizeTooltip = function() {
	$(this).prop('title', getResource($(this).prop('title')));
	$(this).tooltip();
};

$.fn.localize = function() {

	$('[localize]', '#' + $(this).attr('id')).each(function(i,obj) {
		text = getResource([$(obj).attr('localize')]);
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
	showMessage(text, 'fa-warning', 'alert-danger', typeof fade == 'undefined' ? false : fade, fadeCallback);
}

function showWarning(text, fade, fadeCallback) {
	showMessage(text, 'fa-warning', 'alert-warning', typeof fade == 'undefined' ? false : fade, fadeCallback);
}

function showSuccess(text, fade, fadeCallback) {
	showMessage(text, 'fa-warning', 'alert-success', typeof fade == 'undefined' ? true : fade, fadeCallback);
}

function showInformation(text, fade, fadeCallback) {
	showMessage(text, 'fa-info', 'alert-info', typeof fade == 'undefined' ? true : fade, fadeCallback);
}

function removeMessage() {
	$('#systemMessage').remove();
}

function showMessage(text, icon, alertClass, fade, fadeCallback) {
	
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
	
	$('body').prepend('<div id="systemMessage" class="alert ' + alertClass + '" style="position: fixed; top: 0; left: 0; bottom: 0; right: 0; z-index: 1050; height: 50px"/>');
	$('#systemMessage').append('<i class="fa ' + icon + '"></i>&nbsp;&nbsp;<span>' + text + '</span><i id="messageDismiss" class="fa fa-times" style="float: right; cursor: pointer;"></i>');
	
	$('#messageDismiss').click(function() {
		doFade();
	});
	
	if(fade) {
		setTimeout(doFade, 4000);
	}
}

function getJSON(url, params, callback, errorCallback) {
	log("GET: " + url);
	
	if(!url.startsWith('/')) {
		url = basePath + '/api/' + url;
	}
	$.ajax({
		type: "GET",
	    url:  url + (params ? (url.endsWith('?') ? '' : '?') + $.param(params) : ''),
	    cache: false,
	    dataType: 'json',
	    success: callback
	}).fail(function(xmlRequest) {
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

function postJSON(url, params, callback, errorCallback, alwaysCallback) {
	
	log("POST: " + url);
	
	if(!url.startsWith('/')) {
		url = basePath + '/api/' + url;
	}
	$.ajax({
		type: "POST",
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

function deleteJSON(url, params, callback, errorCallback) {
	
	log("DELETE: " + url);
	
	if(!url.startsWith('/')) {
		url = basePath + '/api/' + url;
	}
	
	$.ajax({
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

function pollForServerContact() {
	
	polling = true;
	$.ajax({
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

function isReplacementVariable(value) {
	if(typeof value == 'string') {
		return value.trim().startsWith('${') && value.trim().endsWith('}');
	} else {
		return false;
	}
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

function fixSplit(value) {
	return value.join(']|[');
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


