var UPPERCASE_RE = /([A-Z])/g;
var LOWERCASE_RE = /([a-z])/g;
var NUMBER_RE = /([\d])/g;
var SPECIAL_CHAR_RE = /([\?\-])/g;
var NON_REPEATING_CHAR_RE = /([\w\d\?\-])\1{2,}/g;
var specials = [
    '/', '.', '*', '+', '?', '|', '$', ':', ';', '"', '\'', '-',
    '(', ')', '[', ']', '{', '}', '\\', '<', '>', ',', '^'
];


function isStrongEnough(password, policy, norepeat) {
	  var uc = password.match(UPPERCASE_RE);
	  var lc = password.match(LOWERCASE_RE);
	  var n = password.match(NUMBER_RE);
	  var sc = password.match(SPECIAL_CHAR_RE);
	  
	  var criteriaMatches = 0;
	  
	  if(uc==null && policy.minimumUpper == 0 || (uc && uc.length >= policy.minimumUpper)) {
		  criteriaMatches++;
	  }
	  if(lc==null && policy.minimumLower == 0 || (lc && lc.length >= policy.minimumLower)) {
		  criteriaMatches++;
	  }
	  if(n==null && policy.minimumDigits == 0 || (n && n.length >= policy.minimumDigits)) {
		  criteriaMatches++;
	  }
	  if(sc==null && policy.minimumSymbol == 0 || (sc && sc.length >= policy.minimumSymbol)) {
		  criteriaMatches++;
	  }

	  var repeatedChars = 0;
	  if(norepeat) {
		  var nr = password.match(NON_REPEATING_CHAR_RE);
		  if(nr) {
			  repeatedChars = nr.length;
		  }
	  }
	  
	  return password.length >= policy.minimumLength &&
  		password.length <= policy.maximumLength && 
  		criteriaMatches >= policy.minimumCriteriaMatches &&
  		repeatedChars == 0;
}

$.fn.passwordPolicy = function(data) {

	var options = $.extend(
			{  
				policy: 'currentPrincipal',
				showGenerator: true,
				showPolicyName: true,
				title: getResource('passwordRules.text'),
				showRulesDefault: true,
				showZxcvbn: false,
				showGeneratorDefault: true,
				additionalAnalysis: false
			}, data);
	
	var url;
	if(options.policy === 'currentPrincipal') {
		url = 'passwordPolicys/myPolicy';
	} else if(options.policy === 'default') { 
		if(options.realm) {
			url = 'passwordPolicys/default/' + options.realm;
		} else {
			url = 'passwordPolicys/default';
		}
	} else {
		url = 'passwordPolicys/policy/' + options.principalId
	}
	
	if(options.buttonElement) {
		$(options.buttonElement).prop('disabled', true);
	}
	
	var thisDiv = $(this);
	thisDiv.empty();
	
	if(options.buttonElement) {
		$(options.buttonElement).prop('disabled', true);
	}
	
	var validate = function() {
		
		if(options.buttonElement) {
			$(options.buttonElement).prop('disabled', true);
		} else if(options.buttonCallback) {
			options.buttonCallback(true);
		}
		
		if(options.passwordElement && options.passwordElement.val()!=='') {

			var params = new Object();
			params.password = encodeURIComponent(options.passwordElement.val());
			if(options.principalId) {
				params.id = options.principalId;
			}
			if(options.usernameField) {
				options.username = options.passwordElement.val();
			}
			
			postFORM(basePath + '/api/passwordPolicys/analyse', $.param(params), function(data) {
				$('#suggestions').empty();
				if(data.success) {
					if(options.passwordElement.val() == options.confirmElement.val()) {
						$('#suggestions').append('<span class="success">Password looks good</span>');
					} else {
						$('#suggestions').append('<span class="warning">Password is good but needs confirming</span>');
					}
					if(options.buttonElement) {
						$(options.buttonElement).prop('disabled', false);
					} else if(options.buttonCallback) {
						options.buttonCallback(false);
					}
					return;
				} else {
					if (data.message) {
						$('#suggestions').append('<span id="passwordPolicysMessage" class="error"></span>');
						$('#passwordPolicysMessage').text(data.message);
					} else {
						$('#suggestions').append('<span class="error">Password does not conform to password policy</span>');
					}
				}
				if(options.buttonElement) {
					$(options.buttonElement).prop('disabled', true);
				} else if(options.buttonCallback) {
					options.buttonCallback(true);
				}
			}, "json");
			
		
		}
	}
	
	var executeWithDelay = function() {
		
		if(options.timeout) {
			clearTimeout(options.timeout);
		}
		options.timeout = setTimeout(validate, 500);
	}
	
	if(options.passwordElement) {
		thisDiv.append('<div id="suggestions" style="padding-bottom: 10px;"></div>');
		$(options.passwordElement).off('keyup').on('keyup', executeWithDelay);
		$(options.confirmElement).off('keyup').on('keyup', executeWithDelay);
	}

	
	getJSON(url, null, function(data) {

		if(!data.success) {
			var passwordRulesContent;
			if(options.showRulesDefault){
				thisDiv.append('<h5><a class="detail-icon" href="javascript:"><i class="glyphicon glyphicon-minus icon-minus"></i></a>&nbsp;' + options.title + '</h5>');
				passwordRulesContent = thisDiv.append('<div id="passwordRulesContent" style="padding-left: 30px;"></div>').find('#passwordRulesContent');
			}else{
				thisDiv.append('<h5><a class="detail-icon" href="javascript:"><i class="glyphicon glyphicon-plus icon-plus"></i></a>&nbsp;' + options.title + '</h5>');
				passwordRulesContent = thisDiv.append('<div id="passwordRulesContent" style="display: none; padding-left: 30px;"></div>').find('#passwordRulesContent');
			}
			if(data.message == 'Unsupported') {
				passwordRulesContent.append('<span><em>' 
						+ getResource("unsupported.text")
						+ '</em></span><br>');
			}
			else {
				if(options.currentPrincipal) {
					passwordRulesContent.append('<span><em>' 
							+ getResource("noRestrictions.text")
							+ '</em></span><br>');
				} else {				
					passwordRulesContent.append('<span><em>' 
							+ getResource("noRestrictionsOther.text")
							+ '</em></span><br>');
				}
			}
			
		} else {
			var policy = data.resource;
			
			var passwordRulesContent;
			if(options.showRulesDefault){
				if(options.showPolicyName) {
					thisDiv.append('<h5><a class="detail-icon" href="javascript:"><i class="glyphicon glyphicon-minus icon-minus"></i></a>&nbsp;' + policy.name + '</h5>');
				} else {
					thisDiv.append('<h5><a class="detail-icon" href="javascript:"><i class="glyphicon glyphicon-minus icon-minus"></i></a>&nbsp;' + options.title + '</h5>');
				}
				passwordRulesContent = thisDiv.append('<div id="passwordRulesContent" style="padding-left: 30px;"></div>').find('#passwordRulesContent');
			}else{
				if(options.showPolicyName) {
					thisDiv.append('<h5><a class="detail-icon" href="javascript:"><i class="glyphicon glyphicon-plus icon-plus"></i></a>&nbsp;' + policy.name + '</h5>');
				} else {
					thisDiv.append('<h5><a class="detail-icon" href="javascript:"><i class="glyphicon glyphicon-plus icon-plus"></i></a>&nbsp;' + options.title + '</h5>');
				}
				passwordRulesContent = thisDiv.append('<div id="passwordRulesContent" style="display: none; padding-left: 30px;"></div>').find('#passwordRulesContent');
			}

			passwordRulesContent.append('<span>' 
					+ getResource("minLength.text").format(policy.minimumLength)
					+ '</span><br>');
			passwordRulesContent.append('<span>' 
					+ getResource("maxLength.text").format(policy.maximumLength)
					+ '</span><br>');
			
			options.additionalAnalysis = policy.additionalAnalysis;
			
			if(policy.minimumAge > 0) {
				if(policy.minimumAge == 1) {
					passwordRulesContent.append('<span>' 
							+ getResource("oneDay.text")
							+ '</span><br>');
				} else {
					passwordRulesContent.append('<span>' 
							+ getResource("minAge.text").format(policy.minimumAge)
							+ '</span><br>');
				}
			}
			if(policy.maximumAge > 0) {
				passwordRulesContent.append('<span>' 
					+ getResource("maximumAge.text").format(policy.maximumAge)
					+ '</span><br>');
			} else {
				if(options.currentPrincipal) {
					passwordRulesContent.append('<span>' 
						+ getResource("noExpire.text")
						+ '</span><br>');
				} else {
					passwordRulesContent.append('<span>' 
							+ getResource("noExpireOther.text")
							+ '</span><br>');
				}
			}
			
			if(policy.minimumDigits > 0 || policy.minimumLower > 0 || policy.minimumUpper > 0 || policy.minimumSymbol > 0) {
		
				passwordRulesContent.append('<span></span><br><span><em>'
						+ getResource('mustContain.text').format(policy.minimumCriteriaMatches) + ':</em></span><br><br>');
				
				if(policy.minimumDigits > 0) {
					if(policy.minimumDigits == 1) {
						passwordRulesContent.append('<span>' 
								+ getResource("oneDigit.text")
								+ '</span><br>');
					} else {
						passwordRulesContent.append('<span>' 
								+ getResource("minDigits.text").format(policy.minimumDigits)
								+ '</span><br>');
					}
				}
				
				if(policy.minimumLower > 0) {
					if(policy.minimumLower == 1) {
						passwordRulesContent.append('<span>' 
								+ getResource("oneLower.text")
								+ '</span><br>');
					} else {
						passwordRulesContent.append('<span>' 
								+ getResource("minLower.text").format(policy.minimumLower)
								+ '</span><br>');
					}
				}
				
				if(policy.minimumUpper > 0) {
					if(policy.minimumUpper == 1) {
						passwordRulesContent.append('<span>' 
								+ getResource("oneUpper.text")
								+ '</span><br>');
					} else {
						passwordRulesContent.append('<span>' 
								+ getResource("minUpper.text").format(policy.minimumDigits)
								+ '</span><br>');
					}
				}
				
				if(policy.minimumSymbol > 0) {
					if(policy.minimumSymbol == 1) {
						passwordRulesContent.append('<span>' 
								+ getResource("oneSymbol.text")
								+ '</span><br>');
					} else {
						passwordRulesContent.append('<span>' 
								+ getResource("minSymbol.text").format(policy.minimumSymbol)
								+ '</span><br>');
					}
				}
				
				
			}
			
			passwordRulesContent.append('<span></span><br>');
			
			if(!policy.containDictionaryWord) {
				passwordRulesContent.append('<span><em>' 
						+ getResource("noDictionary.text")
						+ '</em></span><br>');
			}
			
			if(!policy.containUsername) {
				if(options.currentPrincipal) {
					passwordRulesContent.append('<span><em>' 
							+ getResource("noUsername.text")
							+ '</em></span><br>');
				} else {
					passwordRulesContent.append('<span><em>' 
							+ getResource("noUsernameOther.text")
							+ '</em></span><br>');
				}
			}
			
			if(policy.passwordHistory > 0) {
				if(options.currentPrincipal) {
					passwordRulesContent.append('<span><em>' 
							+ getResource("passwordHistory.text").format(policy.passwordHistory)
							+ '</em></span><br>');
				} else {
					passwordRulesContent.append('<span><em>' 
							+ getResource("passwordHistoryOther.text").format(policy.passwordHistory)
							+ '</em></span><br>');
				}
			}
		}
		
		$('#passwordRulesContent').prev().find('a').click(function(){
			$('#passwordRulesContent').toggle();
			if($('#passwordRulesContent:visible').length != 0){
				$(this).find('i').removeClass('glyphicon-plus');
				$(this).find('i').removeClass('icon-plus');
				
				$(this).find('i').addClass('glyphicon-minus');
				$(this).find('i').addClass('icon-minus');
			}else{
				$(this).find('i').removeClass('glyphicon-minus');
				$(this).find('i').removeClass('icon-minus');
				
				$(this).find('i').addClass('glyphicon-plus');
				$(this).find('i').addClass('icon-plus');
			}
		});
		
		if(options.showGenerator && policy) {
			thisDiv.append('<span></span><br>');

			function customPassword(policy) {
			  var password = "";
			  
			  while (!isStrongEnough(password, policy, false)) {
			    password = generatePassword(policy.minimumLength + (policy.minimumLength / 2), false, new RegExp("[\\w\\d" + RegExp.escape(policy.validSymbols) + "]"));
			    log('Generated ' + password);
			  }
			  return password;
			}

			var passwordGeneratorContent;
			if(options.showGeneratorDefault){
				thisDiv.append('<h5><a class="detail-icon" href="javascript:"><i class="glyphicon glyphicon-minus icon-minus"></i></a>&nbsp;' + getResource('passwordGenerator.text') + '</h5>');
				passwordGeneratorContent = thisDiv.append('<div id="passwordGeneratorContent" style="padding-left: 30px;"></div>').find('#passwordGeneratorContent');
			}else{
				thisDiv.append('<h5><a class="detail-icon" href="javascript:"><i class="glyphicon glyphicon-plus icon-plus"></i></a>&nbsp;' + getResource('passwordGenerator.text') + '</h5>');
				passwordGeneratorContent = thisDiv.append('<div id="passwordGeneratorContent" style="display: none; padding-left: 30px;"></div>').find('#passwordGeneratorContent');
			}
			
			$('#passwordGeneratorContent').prev().find('a').click(function(){
				$('#passwordGeneratorContent').toggle();
				if($('#passwordGeneratorContent:visible').length != 0){
					$(this).find('i').removeClass('glyphicon-plus');
					$(this).find('i').removeClass('icon-plus');
					
					$(this).find('i').addClass('glyphicon-minus');
					$(this).find('i').addClass('icon-minus');
				}else{
					$(this).find('i').removeClass('glyphicon-minus');
					$(this).find('i').removeClass('icon-minus');
					
					$(this).find('i').addClass('glyphicon-plus');
					$(this).find('i').addClass('icon-plus');
				}
			});
			
			passwordGeneratorContent.append('<div><span><strong>' 
					+ getResource("suggestedPassword.text")
					+ '</strong></span></div>');
			
			passwordGeneratorContent.append('<div id="generatedPassword"><div id="passwordHolder"><span id="suggestedPassword" class="success"></span></div><a href="#" id="regeneratePassword" data-toggle="tooltip" data-placement="top" title="'
					 + getResource("regeneratePassword.text") + '"><i class="fa fa-2x fa-refresh"></i></a></div>');
			
			passwordGeneratorContent.append('<div id="passwordStrength"></div>');
			
			$('#passwordStrength').sliderInput({
				min: policy.minimumLength,
				max: policy.maximumLength,
				value: policy.minimumLength,
				labelResourceKey: 'passwordStrength.label',
				changed: function(widget) {
					$('#regeneratePassword').click();
				}
			});
			
			$('#regeneratePassword').click(function(e) {
				e.preventDefault();
				getJSON('passwordPolicys/generate/' + policy.id + '/' + $('#passwordStrength').widget().getValue(), null, function(data) {
					if(!data.success) {
						showError(data.message);
					} else {
						$('#suggestedPassword').text(data.resource);
					}
				});		
			});
			
			$('#regeneratePassword').click();
			
			if(options.passwordElement && options.confirmElement) {
				$('#generatedPassword').append('<span>&nbsp;&nbsp;</span><a href="#" id="insertPassword" data-toggle="tooltip" data-placement="top" title="'
						 + getResource("injectCredentials.text") + '"><i class="fa fa-2x fa-magic"></i></a>');
				$('#insertPassword').click(function(e) {
					e.preventDefault();
					options.passwordElement.val($('#suggestedPassword').text());
					options.confirmElement.val($('#suggestedPassword').text());
					validate();
				});
				
				$('#generatedPassword').append('<span>&nbsp;&nbsp;</span><a href="#" class="copyPassword" data-toggle="tooltip" data-placement="top" title="'
						 + getResource("copyCredentials.text") + '"><i class="fa fa-2x fa-copy"></i></a>');
			
				var opts = {
					    text: function(e) {
					    	var pwd = $('#suggestedPassword').text();
					        return pwd;
					    }
				};
				
				if(options.bootstrapContainer) {
					opts.container = document.getElementById(options.bootstrapContainer);
				}
				
				var clipboard = new Clipboard('.copyPassword', opts);
				
				clipboard.on('success', function(e) {
					showSuccess("Copied password to clipboard");
				});
				
				clipboard.on('error', function(e) {
					showError("Clipboard error!");
				});
			}
			
			$('[data-toggle="tooltip"]').tooltip();
		}
		
		validate();
		if(options.complete) {
			options.complete();
		}
	});
}
