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
		if(opts.showBusy) {
			opts.showBusy();
		}
		showLogon(credentials, opts);
	});
}

function showLogon(credentials, opts, message) {

	log("Showing logon");

	if(opts.logonStarted) {
		opts.logonStarted();
	}
	
	var url = basePath + '/api/logon';
	if(opts.scheme) {
		url += '/' + opts.scheme;
	}
	
	$.getJSON(url, credentials, function(data) {
		processLogon(data, opts, message);
	});
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

		opts.formContent.append(
			'<form id="logonForm" class="' + (data.formTemplate.formClass ? data.formTemplate.formClass : "form-signin") + '" role="form"/>');

		if (data['errorMsg']) {
			$('#logonForm')
					.append(
						'<h2 class="form-signin-heading error">' + (data.lastErrorIsResourceKey ? getResource(data['errorMsg']) : data['errorMsg']) + '</h2>');
		} else if (message) {
			$('#logonForm').append(
				'<h2 class="form-signin-heading">' + message + '</h2>');
		} else {
			$('#logonForm').append('<h2 class="form-signin-heading"></h2>');
		}

		$('#logonForm').attr("action", "../api/logon").attr("method", "post");
		
		var links = new Array();
		var scripts = new Array();
		
		if(data.formTemplate) {
			$.each(data.formTemplate.inputFields, function() {
				if (this.type == 'hidden') {
					$('#logonForm').append('<input type="' + this.type + '" name="' 
								+ this.resourceKey + '" id="' 
								+ this.resourceKey + '" value="' 
								+ this.defaultValue + '"/>');
					return;
				} else if (this.type == 'p') {
					if(this.valueResourceKey) {
						$('#logonForm').append('<p>' + getResource(this.defaultValue) + '</p>');
					} else {
						$('#logonForm').append('<p>' + this.defaultValue + '</p>');
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
					$('#' + this.resourceKey).load(this.defaultValue, function() {
						
					});
					return;
				}
	
				if (this.type == 'select') {
					$('#logonForm').append('<select class="logonSelect" name="' 
							+ this.resourceKey + '" id="' + this.resourceKey + '"/>');
					currentKey = this.resourceKey;
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
	
				} else {
					$('#logonForm')
							.append(
								'<input class="form-control" type="' + this.type + '" name="' 
								+ this.resourceKey + '" placeholder="'
								+ (this.label != null ? this.label : getResource(this.resourceKey + ".label")) 
								+ '" id="' + this.resourceKey + '" value="' + this.defaultValue + '"/>');
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
			if(data.formTemplate.showLogonButton) {
				$('#logonForm').append(
						'<button id="logonButton" class="btn btn-lg btn-primary btn-block" type="submit">' 
							+ (data.last ? getResource("text.logon") : getResource("text.next")) 
							+ '&nbsp;<i style="padding: 4px 10px 0px 0px" class="fa fa-sign-in"></i></button>');
			}
		}
		
		if(!data.postAuthentication) {
			$('#logonForm').append('<div class="logonLink center"><a id="resetLogon" href="#">' + getResource("restart.logon") + '</a></div>');
			
			$('#resetLogon').click(function(e) {
				e.preventDefault();
				
				getJSON('logon/reset', null, function(data) {
					processLogon(data, opts);
				});
			});
		}
		
		$.each(links, function(idx, obj) {
			
			$('#logonForm').append('<div class="logonLink center"><a id="' 
					+ this.label + '" href="#">' 
					+ getResource(this.resourceKey) + '</a></div>');
		
			$('#' + obj.label).click(function(e) {
				e.preventDefault();
				
				getJSON(obj.defaultValue, null, function(data) {
					processLogon(data, opts);
				});
			});
		});
		

		
		$('#logonButton')
				.click(
					function(evt) {

						log("Submitting logon");

						evt.preventDefault();
						credentials = 'action=logon';
						$
								.each(
									data['formTemplate']['inputFields'],
									function() {
										var name = encodeURIComponent(this.resourceKey);
										var value = encodeURIComponent($('#' + this.resourceKey).val());
										credentials = credentials + '&' + name + '=' + value;
									});

						logon(credentials, opts);
					});

		// Logon banner?

		if (data['bannerMsg']) {
			opts.formContent
					.append(
						'<div class="col-md-3"></div><div id="logonBanner" class="col-md-6"><p>' + data['bannerMsg'] + '</p></div><div class="col-md-3"></div>');
		}

	} else {
		log("User is logged in");
		$(document).data('session', data.session);
		
		if(opts.logonCompleted) {
			opts.logonCompleted(data);
		}

	}

	if(opts.hideBusy) {
		opts.hideBusy();
	}

}
