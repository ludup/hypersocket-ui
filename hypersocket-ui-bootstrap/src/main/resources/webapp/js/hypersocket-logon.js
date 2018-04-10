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
		showLogon(credentials, opts);
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
			'<form id="logonForm" autocomplete="off" class="panel panel-default ' + (data.formTemplate.formClass ? data.formTemplate.formClass : "form-signin") + '" role="form"/>');

		if (data['errorMsg']) {
			showError(data['errorMsg']);
		}


		$('#logonForm').attr("action", "../api/logon").attr("method", "post");

		var links = new Array();
		var scripts = new Array();
		var setFocus = false;
		if(data.formTemplate) {

			$('#logonForm').before('<h1 class="form-scheme-heading">' + getResource(data.formTemplate.scheme + '.logon.title') + '</h1>');

			$.each(data.formTemplate.inputFields, function() {
				if (this.type == 'hidden') {
					$('#logonForm').append('<input type="' + this.type + '" name="'
								+ this.resourceKey + '" autocomplete="off" id="'
								+ this.resourceKey + '" value="'
								+ stripNull(this.defaultValue) + '"/>');
					return;
				} else if (this.type == 'p') {
					if(this.valueResourceKey) {
						$('#logonForm').append('<p class="center">' + getResource(this.defaultValue) + '</p>');
					} else {
						$('#logonForm').append('<p class="center">' + this.defaultValue + '</p>');
					}

					return;
				} else if (this.type == 'pre') {
					if(this.valueResourceKey) {
						$('#logonForm').append('<pre>' + getResource(this.defaultValue) + '</pre>');
					} else {
						$('#logonForm').append('<pre>' + stripNull(this.defaultValue) + '</pre>');
					}

					return;
				} else if(this.type == 'a') {
					links.push(this);
					return;
				} else if(this.type == 'script') {
					scripts.push(this);
					return;
				} else if(this.type == 'div') {
					$('#logonForm').append('<div id="' + this.resourceKey + '"></div>');
					$('#' + this.resourceKey).load(replacePaths(this.defaultValue), function() {

					});
					return;
				} else if(this.type == 'html') {
					$('#logonForm').append('<div id="' + this.resourceKey + '" class="center"></div>');
					$('#' + this.resourceKey).html(replacePaths(this.defaultValue));
					return;
				} else if(this.type =='img') {
					$('#logonForm').append('<div class="center"><img id="' + this.resourceKey + '" src="' + replacePaths(this.defaultValue) + '"></img></div>');
					return;
				}

				if (this.type == 'select') {

					$('#logonForm').append('<div class="logonInput"><select class="logonSelect" name="'
							+ this.resourceKey + '" id="' + this.resourceKey
							+ '" title="' + ((this.infoKey != null && this.infoKey.length > 0) ? getResource(this.infoKey) : "")
							+ '"/></div>');
					currentKey = this.resourceKey;
					var changeFunc = this.onChange;
					$.each(
						this.options,
						function() {
							option = '<option';
							if (this.selected) {
								option += ' selected';
							}
							if (this.value) {
								option += ' value="' + this.value + '"';
							}
							option += '>' + (this.isNameResourceKey ? getResource(this.name) : this.name) + '</option>';
							$('#' + currentKey).append(option);
					});
					var changeFunc = this.onChange;
					$('#' + currentKey).change(function() {

						if(window[changeFunc]) {
							window[changeFunc]($(this), opts);
						}
					});

//					$('#logonForm').append('<div id="' + this.resourceKey + 'Select"></div>');
//					this.isWidget = true;
//					currentKey = this.resourceKey + 'Select';
//					var changeFunc = this.onChange;
//					var options = this.options;
//
//					$('#' + currentKey).textDropdown({
//						values: options,
//						selectedIsObjectList: true,
//						changed: function(widget) {
//							if(window[changeFunc]) {
//								window[changeFunc](widget, opts);
//							}
//						}
//					});
				} else if(this.type == 'checkbox') {
				    $('#logonForm')
                            .append(
                                '<div class="logonInput checkbox"><label id="'+ this.resourceKey + 'Label">'
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
						'<div class="logonInput"><textarea class="form-control" " name="'
						+ this.resourceKey + '" placeholder="'
						+ (this.label != null ? this.label : getResource(this.resourceKey + ".label"))
						+ '" id="' + this.resourceKey + '" title="' + ((this.infoKey != null && this.infoKey.length > 0) ? getResource(this.infoKey) : "")
						+ '">' + stripNull(this.defaultValue) + '</textarea></div>');
					if(!setFocus) {
						$('#' + this.resourceKey).focus();
						setFocus = true;
					}
				}else {
					$('#logonForm')
							.append(
								'<div class="logonInput"><input class="form-control" type="' + this.type + '" name="'
								+ this.resourceKey + '" placeholder="'
								+ (this.label != null ? this.label : getResource(this.resourceKey + ".label"))
								+ '" id="' + this.resourceKey + '" value="' + stripNull(this.defaultValue)
								+ '" title="' + ((this.infoKey != null && this.infoKey.length > 0) ? getResource(this.infoKey) : "")
								+ '"/></div>');
					if(!setFocus) {
						$('#' + this.resourceKey).focus();
						setFocus = true;
					}
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
				$('#logonForm').append('<div class="form-signin-warning">' + getResource(data.formTemplate.scheme + '.warning.title') + '</div>');
			}
			if(data.formTemplate.showLogonButton) {
				$('#logonForm').append(
						'<button id="logonButton" class="btn btn-lg btn-primary btn-block" type="submit">'
							+ (data.formTemplate.logonButtonResourceKey ? getResourceOrText(data.formTemplate.logonButtonResourceKey) : getResource("text.next"))
							+ '&nbsp;<i class="fa ' + (data.formTemplate.logonButtonIcon ? data.formTemplate.logonButtonIcon : 'fa-sign-in') + '"></i></button>');
			}

			if(!data.postAuthentication) {
				$('#logonForm').after('<p class="form-signin-security form-signin-warning">' + getResource(data.formTemplate.scheme + '.security.title') + '</p>');
			}
		}

		if(!data.postAuthentication) {
			if(data.formTemplate.overrideStartAgain || (!data.first && data.formTemplate.showStartAgain)) {
				$('#logonForm').append('<div class="logonLink center"><a id="resetLogon" href="#">' + getResource("restart.logon") + '</a></div>');
				$('#resetLogon').click(function(e) {
					e.preventDefault();
					getJSON('logon/switchRealm/' + opts.scheme + '/' + encodeURIComponent(data.realm.name) + '/', null, function(data) {
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

							    var elem = $('#' + this.resourceKey);
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
