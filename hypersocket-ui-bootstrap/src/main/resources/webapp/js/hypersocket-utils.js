var regex = new RegExp(/(.[^\:]+)(\:\/\/)(.[^\/]+)(.[^\/]+)(.[^\/]+)(.*)/);

var url = regex.exec(document.URL);
var baseURL = url[1] + url[2] + url[3] + url[4];
var basePath = url[4];

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
	
function loadResources(callback) {
	if(!$(document).data('i18n')) {
		getJSON('i18n', null, function(data) {
			$(document).data('i18n', data);
			if(callback) {
				callback();
			}
		});
	} else {
		if(callback) {
			callback();
		}
	}
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

$.fn.localizeTooltip = function() {
	$(this).prop('title', getResource($(this).prop('title')));
	$(this).tooltip();
};

$.fn.localize = function() {

	$('[localize]', '#' + $(this).attr('id')).each(function(i,obj) {
		text = getResource([$(obj).attr('localize')]);
		$(obj).text(text);
	});
};


function clearError() {
	$('#highlight').remove();
}

function showError(fade, text) {
	
	log("ERROR: " + text);
	
	$('#highlight').remove();
	
	$('#informationBar').append('<div id="highlight"/>');
	$('#highlight').addClass('alert');
	$('#highlight').addClass('alert-danger');
	$('#highlight').append('<span>' + text + "</span>");
	if(fade) {
		$('#highlight').fadeOut(5000, function() {
			$('#highlight').remove();
		});
	} else {
		$('#highlight').append('<a href="#" id="closeError"><span class="ui-icon ui-icon-circle-close" style="float: right; margin-right: .3em;"></span></a>');
		
		$('#closeError').click(function(e) {
			e.preventDefault();
			$('#highlight').remove();
		});
	}
}

function showInformation(fade, text) {
	
	log("INFO: " + text);
	
	$('#highlight').remove();
	
	$('#informationBar').append('<div id="highlight"/>');
	
	$('#highlight').addClass('ui-state-highlight');
	$('#highlight').addClass('ui-corner-all');
	$('#highlight').append('<span class="ui-icon ui-icon-info" style="float: left; margin-right: .3em;"></span><span>' + text + "</span>");
	if(fade) {
		$('#highlight').fadeOut(5000, function() {
			$('#highlight').remove();
		});
	} else {
		$('#highlight').append('<a href="#" id="closeHighlight"><span class="ui-icon ui-icon-circle-close" style="float: right; margin-right: .3em;"></span></a>');
		
		$('#closeHighlight').click(function(e) {
			e.preventDefault();
			$('#highlight').remove();
		});
	}
}

$.fn.dialogError = function(resourceKey) {
	$('#dialogErrorHighlight' + $(this).attr('id'), $(this)).remove();
	
	if(resourceKey!='reset') {
	 	$(this).append('<div id="dialogErrorHighlight'  + $(this).attr('id') + '" class="alert alert-danger"/>');
			$('#dialogErrorHighlight' + $(this).attr('id')).append('<span>' 
					+ (getResource(resourceKey)==undefined ? resourceKey : getResource(resourceKey))
					+ '</span>');
	}
};

$.fn.dialogInformation = function(resourceKey) {
	$('#dialogErrorHighlight' + $(this).attr('id'), $(this)).remove();
	
	if(resourceKey!='reset') {
	 	$(this).append('<div id="dialogErrorHighlight'  + $(this).attr('id') + '" class="alert-alert-info"/>');
			$('#dialogErrorHighlight' + $(this).attr('id')).append('<span>' 
					+ (getResource(resourceKey)==undefined ? resourceKey : getResource(resourceKey))
					+ '</span>');
	}
};
function getJSON(url, params, callback) {
	log("GET: " + url);
	
	$.getJSON(basePath + '/api/' + url, params, callback).error(function() {
		showError(false, url + " JSON request failed.");
	});
};

function postJSON(path, params, callback) {
	
	log("POST: " + path);
	
	$.ajax({
		type: "POST",
	    url:  basePath + '/api/' + path,
	    dataType: 'json',
	    contentType: 'application/json',
	    data: JSON.stringify(params),
	    success: callback
	}).error(function() {
		showError(false, url + " JSON request failed.");
	});
	
};

function deleteJSON(path, params, callback) {
	
	log("DELETE: " + path);
	
	$.ajax({
		type: "DELETE",
	    url:  basePath + '/api/' + path,
	    dataType: 'json',
	    contentType: 'application/json',
	    data: JSON.stringify(params),
	    success: callback
	}).error(function() {
		showError(false, url + " JSON request failed.");
	});
};


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

function isValidURL(str) {
	return /((http|https):\/\/(\w+:{0,1}\w*@)?(\S+)|)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/.test(str);
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