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
				showPolicyName: false,
				title: getResource('passwordRules.text'),
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
	
	var thisDiv = $(this);
	thisDiv.empty();
	getJSON(url, null, function(data) {

		if(!data.success) {
			
			thisDiv.append('<h4>' + options.title + '</h4>');
			
			if(data.message == 'Unsupported') {
				thisDiv.append('<span><em>' 
						+ getResource("unsupported.text")
						+ '</em></span><br>');
			}
			else {
				if(options.currentPrincipal) {
					thisDiv.append('<span><em>' 
							+ getResource("noRestrictions.text")
							+ '</em></span><br>');
				} else {				
					thisDiv.append('<span><em>' 
							+ getResource("noRestrictionsOther.text")
							+ '</em></span><br>');
				}
			}
			
		} else {
			var policy = data.resource;
			
			if(options.showPolicyName) {
				thisDiv.append('<h4>' + policy.name + '</h4>');
			} else {
				thisDiv.append('<h4>' + options.title + '</h4>');
			}
			
			if(options.passwordElement && options.confirmElement) {
				
				options.passwordElement.on('change', function() {
					options.passwordElement.siblings('i').remove();
					if(options.passwordElement.val()!=='') {
						var params = new Object();
						params.password = encodeURIComponent(options.passwordElement.val());
						if(options.principalId) {
							params.id = options.principalId;
						}
						if(options.usernameField) {
							options.username = options.passwordElement.val();
						}
						postFORM(basePath + '/api/passwordPolicys/analyse', $.param(params), function(data) {
							if(data.success) {
								options.passwordElement.after('<i class="fa fa-check success passwordValidationIcon"></i>');
							} else {
								options.passwordElement.after('<i class="fa fa-times error passwordValidationIcon"></i>');
							}
						}, "json");
					
					}
				});
				
				options.confirmElement.on('change', function() {
					
					options.confirmElement.siblings('i').remove();
					if(options.confirmElement.val() === options.passwordElement.val()) {
						options.confirmElement.after('<i class="fa fa-check success passwordValidationIcon"></i>');
					} else {
						options.confirmElement.after('<i class="fa fa-times error passwordValidationIcon"></i>');
					}
				});
			}

			thisDiv.append('<span>' 
					+ getResource("minLength.text").format(policy.minimumLength)
					+ '</span><br>');
			thisDiv.append('<span>' 
					+ getResource("maxLength.text").format(policy.maximumLength)
					+ '</span><br>');
			if(policy.minimumAge > 0) {
				if(policy.minimumAge == 1) {
					thisDiv.append('<span>' 
							+ getResource("oneDay.text")
							+ '</span><br>');
				} else {
					thisDiv.append('<span>' 
							+ getResource("minAge.text").format(policy.minimumAge)
							+ '</span><br>');
				}
			}
			if(policy.maximumAge > 0) {
				thisDiv.append('<span>' 
					+ getResource("maximumAge.text").format(policy.maximumAge)
					+ '</span><br>');
			} else {
				if(options.currentPrincipal) {
					thisDiv.append('<span>' 
						+ getResource("noExpire.text")
						+ '</span><br>');
				} else {
					thisDiv.append('<span>' 
							+ getResource("noExpireOther.text")
							+ '</span><br>');
				}
			}
			
			if(policy.minimumDigits > 0 || policy.minimumLower > 0 || policy.minimumUpper > 0 || policy.minimumSymbol > 0) {
		
				thisDiv.append('<span></span><br><span><em>'
						+ getResource('mustContain.text').format(policy.minimumCriteriaMatches) + ':</em></span><br><br>');
				
				if(policy.minimumDigits > 0) {
					if(policy.minimumDigits == 1) {
						thisDiv.append('<span>' 
								+ getResource("oneDigit.text")
								+ '</span><br>');
					} else {
						thisDiv.append('<span>' 
								+ getResource("minDigits.text").format(policy.minimumDigits)
								+ '</span><br>');
					}
				}
				
				if(policy.minimumLower > 0) {
					if(policy.minimumLower == 1) {
						thisDiv.append('<span>' 
								+ getResource("oneLower.text")
								+ '</span><br>');
					} else {
						thisDiv.append('<span>' 
								+ getResource("minLower.text").format(policy.minimumLower)
								+ '</span><br>');
					}
				}
				
				if(policy.minimumUpper > 0) {
					if(policy.minimumUpper == 1) {
						thisDiv.append('<span>' 
								+ getResource("oneUpper.text")
								+ '</span><br>');
					} else {
						thisDiv.append('<span>' 
								+ getResource("minUpper.text").format(policy.minimumDigits)
								+ '</span><br>');
					}
				}
				
				if(policy.minimumSymbol > 0) {
					if(policy.minimumSymbol == 1) {
						thisDiv.append('<span>' 
								+ getResource("oneSymbol.text")
								+ '</span><br>');
					} else {
						thisDiv.append('<span>' 
								+ getResource("minSymbol.text").format(policy.minimumSymbol)
								+ '</span><br>');
					}
				}
				
				
			}
			
			thisDiv.append('<span></span><br>');
			
			if(!policy.containDictionaryWord) {
				thisDiv.append('<span><em>' 
						+ getResource("noDictionary.text")
						+ '</em></span><br>');
			}
			
			if(!policy.containUsername) {
				if(options.currentPrincipal) {
					thisDiv.append('<span><em>' 
							+ getResource("noUsername.text")
							+ '</em></span><br>');
				} else {
					thisDiv.append('<span><em>' 
							+ getResource("noUsernameOther.text")
							+ '</em></span><br>');
				}
			}
			
			if(policy.passwordHistory > 0) {
				if(options.currentPrincipal) {
					thisDiv.append('<span><em>' 
							+ getResource("passwordHistory.text").format(policy.passwordHistory)
							+ '</em></span><br>');
				} else {
					thisDiv.append('<span><em>' 
							+ getResource("passwordHistoryOther.text").format(policy.passwordHistory)
							+ '</em></span><br>');
				}
			}
		}

		if(options.showGenerator && policy) {
			thisDiv.append('<span></span><br>');

			function customPassword(policy) {
			  var password = "";
			  
			  while (!isStrongEnough(password, policy, false)) {
			    password = generatePassword(policy.minimumLength + (policy.minimumLength / 2), false, new RegExp("[\\w\\d" + RegExp.escape(policy.validSymbols) + "]"));
			  }
			  return password;
			}

			thisDiv.append('<div><span><strong>' 
					+ getResource("suggestedPassword.text")
					+ '</strong></span></div>');
			
			thisDiv.append('<div id="generatedPassword"><div id="passwordHolder"><span id="suggestedPassword" class="success"></span></div><a href="#" id="regeneratePassword" data-toggle="tooltip" data-placement="top" title="'
					 + getResource("regeneratePassword.text") + '"><i class="fa fa-2x fa-refresh"></i></a></div>');
			
			thisDiv.append('<div id="passwordStrength"></div>');
			
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
					options.passwordElement.trigger('change');
					options.confirmElement.val($('#suggestedPassword').text());
					options.confirmElement.trigger('change');
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
		
		
		if(options.complete) {
			options.complete();
		}
	});
}
