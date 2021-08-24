var submitLogon;

/**
 * Perform a logon against the REST API and/or show logon form in the specified
 * div id.
 *
 * @param credentials
 */
function logon(credentials, opts) {

	log("Logging on");

	submitLogon = function(params) {
	    logon(params, opts);
	};

	loadResources(function() {
		
		if(opts.start) {
	        var url = basePath + '/api/logon/reset';
			if(opts.scheme) {
				url += '/' + opts.scheme;
			}
			if(opts.requestParameters) {
				url += '?' + $.param(opts.requestParameters);
			}
	        getJSON(url, null, function(data) {
	            opts.start = false;
	            processLogon(data, opts);
	        });
	    } else {
			showLogon(credentials, opts);
		}
	});
}

function showLogon(credentials, opts, message) {
	log("Showing logon");

	if(opts.logonStarted) {
		opts.logonStarted();
	}

	if(credentials && window.location.search.length > 0) {
		/* Make sure any URL parameters are passed on as well (e.g. redirectHome), but
		 * only do this when actually sending credentials */
		credentials += '&' + window.location.search.substring(1);
	}

	var url = basePath + '/api/logon';
	if(opts.scheme) {
		url += '/' + opts.scheme;
	}

	postFORM(url, credentials, function(data) {
	   	if(!checkRedirect(data))
	   		processLogon(data, opts, message);
	});
}

function checkRedirect(data) {
	if(data.location) {
		log('Changing to ' + data.location);
		window.location = data.location;
		return true;
	}
	else
		return false;
}

function processLogon(data, opts, message) {
	log("Received logon data");

	if(opts.processResponse) {
		opts.processResponse(data);
	}
	
	if (!data.success) {

		opts.formContent.empty();

		if(opts.processForm) {
			opts.processForm(data);
		}

		log("Logon form present");
		removeMessage();

		opts.formContent.append(
			'<div><form id="logonForm" autocomplete="off" class="panel panel-default ' + (data.formTemplate.formClass ? data.formTemplate.formClass : "form-signin") + '" role="form"/></div>');

		if (data['errorMsg']) {
			if("success" === data['errorStyle']) {
				showSuccess(data['errorMsg']);
			} else if("info" ===  data['errorStyle']) {
				showInformation(data['errorMsg']); 
			} else if("warning" ===  data['errorStyle']) {
				showWarning(data['errorMsg']); 
			} else {
				showError(data['errorMsg']);
			}
			
		}


		$('#logonForm').attr("action", "../api/logon").attr("method", "post");

		var links = new Array();
		var scripts = new Array();
		var setFocus = false;
		if(data.formTemplate) {

			$('#logonForm').before('<h1 class="form-scheme-heading">' 
					+ getResourceOrDefault(data.formTemplate.scheme 
					+ '.logon.title', data.formTemplate.scheme ) + '</h1>');
			$.each(data.formTemplate.inputFields, function() {
				if (this.type == 'hidden') {
					$('#logonForm').append('<input type="' + this.type + '" name="'
								+ this.resourceKey + '" autocomplete="off" id="'
								+ this.resourceKey + '" value="'
								+ stripNull(this.defaultValue) + '"/>');

				} else if (this.type == 'p') {
					if(this.valueResourceKey) {
						$('#logonForm').append('<p class="center' + (this.alert ? ' alert alert-' + this.alertType : '') + '">' + getResource(this.defaultValue) + '</p>');
					} else {
						$('#logonForm').append('<p class="center' + (this.alert ? ' alert alert-' + this.alertType : '') + '">' + this.defaultValue + '</p>');
					}


				} else if (this.type == 'pre') {
					if(this.valueResourceKey) {
						$('#logonForm').append('<pre>' + getResource(this.defaultValue) + '</pre>');
					} else {
						$('#logonForm').append('<pre>' + stripNull(this.defaultValue) + '</pre>');
					}


				} else if(this.type == 'a') {
					links.push(this);

				} else if(this.type == 'script') {
					scripts.push(this);

				} else if(this.type == 'div') {
					$('#logonForm').append('<div id="' + this.resourceKey + '"></div>');
					$('#' + this.resourceKey).load(replacePaths(this.defaultValue), function() {

					});

				} else if(this.type == 'html') {
					$('#logonForm').append('<div id="' + this.resourceKey + '" class="' + this.classes + '"></div>');
					$('#' + this.resourceKey).html(replacePaths(this.defaultValue));
					return;
				} else if(this.type =='img') {
					if(this.url) {
						$('#logonForm').append('<div class="center' + (this.styleClass ? ' ' + this.styleClass : '' ) + '"><a href="' + this.url + '"><img id="' + this.resourceKey + '" ' + (this.alt ? 'alt="' + this.alt + '" ' : '' ) + 'src="' + replacePaths(this.defaultValue) + '"' + (this.width ? 'width=' + this.width : '' ) + '></img></a></div>');
					} else {
						$('#logonForm').append('<div class="center' + (this.styleClass ? ' ' + this.styleClass : '' ) + '"><img id="' + this.resourceKey + '" ' + (this.alt ? 'alt="' + this.alt + '" ' : '' ) + 'src="' + replacePaths(this.defaultValue) + '"' + (this.width ? 'width=' + this.width : '' ) + '></img></div>');
					}
				} else if(this.type == 'countries') {
					$('#logonForm').append(
								'<div class="logonInput">' 
									+ (isIE() ?
									 ('<div class="clear"><span class="help-block">' 
									+  (this.label != null ? this.label : getResource(this.resourceKey + ".label"))
									+ '</span></div>') : '')
								+ '<div id="' + this.resourceKey + 'Select"></div>' 
								+ (this.help ? '<div class="clear"><span class="help-block">' + this.help + '</span></div>' : '')
								+ '</div>');
					$('#logonForm').append('<input name="' + this.resourceKey + '" type="hidden" id="' + this.resourceKey + '" value="' + this.defaultValue + '">');

					this.isWidget = true;
					currentKey = this.resourceKey + 'Select';
					var changeFunc = this.onChange;
					var options = countries;
					var resourceKey = this.resourceKey;
					$('#' + currentKey).textDropdown({
						values: options,
						value: this.defaultValue,
						placeholder: this.label,
						valueAttr: 'code',
						selectedIsObjectList: true,
						changed: function(widget) {
						    $('#' + resourceKey).val(widget.getValue());
							if(window[changeFunc]) {
								window[changeFunc](widget, opts);
							}
						}
					});

				} else if (this.type == 'select') {

					$('#logonForm').append(
								'<div class="logonInput">' 
									+ (isIE() ?
									 ('<div class="clear"><span class="help-block">' 
									+  (this.label != null ? this.label : getResource(this.resourceKey + ".label"))
									+ '</span></div>') : '')
								+ '<div id="' + this.resourceKey + 'Select"></div>' 
								+ (this.help ? '<div class="clear"><span class="help-block">' + this.help + '</span></div>' : '')
								+ '</div>');
								
					$('#logonForm').append('<input name="' + this.resourceKey + '" type="hidden" id="' + this.resourceKey + '" value="' + this.defaultValue + '">');
					this.isWidget = true;
					currentKey = this.resourceKey + 'Select';
					var changeFunc = this.onChange;
					var options = this.options;
					var resourceKey = this.resourceKey;
					$('#' + currentKey).textDropdown({
						values: options,
						placeholder: this.label,
						value: this.defaultValue,
						selectedIsObjectList: true,
						changed: function(widget) {

						    $('#' + resourceKey).val(widget.getValue());
							if(window[changeFunc]) {
								window[changeFunc](widget, opts);
							}
						}
					});
				} else if(this.type == 'radio') {
					
					var _this = this;
					var html = '<div class="logonInput radio "><fieldset id="' + this.resourceKey + '">'
					$.each(this.options, function(idx, obj) {
						html += '<p><strong>'
                                + '<input  type="radio" name="'
                                + _this.resourceKey
                                + '" value="' + obj.value
                                 + '"/>'
                                + obj.name
                                + '</strong></p>';	
						if(obj.description) {
							html += '<p>' + getResourceOrText(obj.description) + '</p>';
						}
					});
				    
					html += "</div></div>";
					$('#logonForm').append(html);
					
				} else if(this.type == 'checkbox') {
				    $('#logonForm')
                            .append(
                                '<div class="logonInput checkbox center"><label id="'+ this.resourceKey + 'Label">'
                                + '<input  type="' + this.type + '" name="'
                                + this.resourceKey
                                + '" id="' + this.resourceKey + '" value="' + this.defaultValue
                                + '" title="' + ((this.infoKey != null && this.infoKey.length > 0) ? getResource(this.infoKey) : "")
                                + '"/>'
                                + ((this.label != null && this.label.length > 0) ? this.label : getResource(this.resourceKey + ".label"))
                                + '</label></div>');
				} else if(this.type == 'textarea') {
					$('#logonForm')
					.append(
						'<div class="logonInput">'
							+ (isIE() ?
									 ('<div class="clear"><span class="help-block">' 
									+  (this.label != null ? this.label : getResource(this.resourceKey + ".label"))
									+ '</span></div>') : '')
						+ '<textarea class="form-control" " name="'
						+ this.resourceKey + '"'
							+ (isIE() ? '' :
							    (' placeholder="' + (this.label != null ? this.label : getResource(this.resourceKey + ".label")) + '"'))
						+ ' id="' + this.resourceKey + '" title="' + ((this.infoKey != null && this.infoKey.length > 0) ? getResource(this.infoKey) : "")
						+ '">' + stripNull(this.defaultValue) + '</textarea>' 
						+ (this.help ? '<div class="clear"><span class="help-block">' + this.help + '</span></div>' : '')
						+ '</div>');
					if(!setFocus) {
						$('#' + this.resourceKey).focus();
						setFocus = true;
					}
				} else {
					$('#logonForm')
							.append(
								'<div class="logonInput">' 
									+ (isIE() ?
									 ('<div class="clear"><span class="help-block">' 
									+  (this.label != null ? this.label : getResource(this.resourceKey + ".label"))
									+ '</span></div>') : '')
								+ '<input class="form-control" type="' + this.type + '" name="' + this.resourceKey + '"'
								+ (isIE() ? '' :
										(' placeholder="' + (this.label != null ? this.label : getResource(this.resourceKey + ".label")) + '"'))
								+ ' id="' + this.resourceKey + '" value="' + stripNull(this.defaultValue)
								+ '" title="' + ((this.infoKey != null && this.infoKey.length > 0) ? getResource(this.infoKey) : "")
								+ '"' + (this.readOnly ? 'readonly="readonly"' : '' ) + '>' 
								+ (this.help ? '<div class="clear"><span class="help-block">' + this.help + '</span></div>' : '')
								+ '</div>');
					if(!setFocus) {
						$('#' + this.resourceKey).focus();
						setFocus = true;
					}
				}

                if(this.classes) {
                	$('#' + this.resourceKey).addClass(this.classes);
                }
			});
		}

		$.each(scripts, function(idx, script) {
			log('Executing script ' + script.resourceKey);
			if(window[script.resourceKey]) {
				window[script.resourceKey](script.defaultValue);
			}
		});

		if(data.formTemplate) {
			if(!data.postAuthentication) {
				$('#logonForm').append('<div class="form-signin-warning">' + getResourceOrDefault(data.formTemplate.scheme + '.warning.title', '') + '</div>');
			}
			if(data.formTemplate.showLogonButton) {
				$('#logonForm').append(
						'<button id="logonButton" class="btn btn-lg btn-primary btn-block" type="submit">'
							+ (data.formTemplate.logonButtonResourceKey ? getResourceOrText(data.formTemplate.logonButtonResourceKey) : getResource("text.next"))
							+ '&nbsp;<i class="fa ' + (data.formTemplate.logonButtonIcon ? data.formTemplate.logonButtonIcon : 'fa-sign-in') + '"></i></button>');
			}

			if(!data.postAuthentication) {
				$('#logonForm').after('<p class="form-signin-security form-signin-warning">' + getResourceOrDefault(data.formTemplate.scheme + '.security.title', '') + '</p>');
			}
		}

		if(!data.postAuthentication) {
			if(data.formTemplate.overrideStartAgain || (!data.first && data.formTemplate.showStartAgain)) {
				$('#logonForm').append('<div class="logonLink center"><a id="resetLogon" href="#">' + getResource("restart.logon") + '</a></div>');
				$('#resetLogon').click(function(e) {
					e.preventDefault();
					getJSON('logon/reset/' + opts.scheme, null, function(data) {
						showLogon(null, opts);
					});
				});
			}
		}

		$.each(links, function(idx, obj) {

			$('#logonForm').append('<div class="logonLink center"><a id="'
					+ this.label + '" href="#">'
					+ getResource(this.resourceKey) + '</a></div>');

			$('#' + obj.label).click(function(e) {
				e.preventDefault();

				if(obj.logonApiLink) {
					getJSON(obj.defaultValue, null, function(data){
					   	if(!checkRedirect(data))
					   		processLogon(data, opts);
					});
				} else {
					window.location = obj.defaultValue;
				}
			});
		});

		$('#logonButton')
				.click(
					function(evt) {

						startSpin($('#logonButton i'), 'fa-sign-in');
						log("Submitting logon");

						evt.preventDefault();
						credentials = 'action=logon';
						$.each(
							data['formTemplate']['inputFields'],
							function() {

								
							    var elem = this.type === 'radio' ? $('input[name="' + this.resourceKey + '"]:checked') : $('#' + this.resourceKey);
								var name = encodeURIComponent(this.resourceKey);
								var value = encodeURIComponent(elem.val());

								if(elem.is(':checkbox')) {
								    credentials = credentials + '&' + name + '=' + elem.is(':checked');
								} else {
								    credentials = credentials + '&' + name + '=' + value;
								}
							});

						logon(credentials, opts);
					});

		// Logon banner?
		if(!data.postAuthentication) {
			if (data['bannerMsg']) {
				opts.formContent
						.append(
							'<div class="col-md-3"></div><div id="logonBanner" class="col-md-6"><p>' + data['bannerMsg'] + '</p></div><div class="col-md-3"></div>');
			}
		}
		
		if(data.formTemplate && data.formTemplate.startAuthentication) {
			$('#logonButton').click();
		}
		
		$(document).data('logonData', data);

	} else {
		log("User is logged in");
		$(document).data('session', data.session);

		if(opts.logonCompleted) {
			opts.logonCompleted(data);
		}

		stopSpin($('#logonButton i'), 'fa-sign-in');

	}


}


function changeLogonRealm(selectButton, opts) {
	getJSON('logon/switchRealm/' + opts.scheme + '/' + encodeURIComponent(selectButton.val()) + '/', null, function(data) {
		showLogon(null, opts);
	})
}
