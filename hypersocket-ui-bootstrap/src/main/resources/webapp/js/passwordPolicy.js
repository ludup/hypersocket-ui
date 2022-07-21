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
				suggestionsElement: false,
				showZxcvbn: false,
				showGeneratorDefault: true,
				additionalAnalysis: false,
				alternativeUi: false,
				columnStyle: 'col-md-6'
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
	
	if(options.buttonElement) {
		$(options.buttonElement).prop('disabled', true);
	}
	
	var validate = function() {
		
		if(options.buttonElement) {
			$(options.buttonElement).prop('disabled', true);
		} else if(options.buttonCallback) {
			options.buttonCallback(true);
		}
		
		var password = options.passwordElement ? options.passwordElement.val() : false;
        var confirm = options.confirmElement ? options.confirmElement.val() : false;
		
		if(password) {

			var params = new Object();
			params.password = encodeURIComponent(password);
			if(options.principalId) {
				params.id = options.principalId;
			}
			if(options.usernameField) {
				options.username = password;
			}
			
			postFORM(basePath + '/api/passwordPolicys/analyse', $.param(params), function(data) {
				options.suggestionsElement.empty();
				if(data.success) {
					if(password === confirm) {
						options.suggestionsElement.append('<strong class="text-success"><i class="far fa-circle-check mr-3"></i>' + getResource('message.goodPassword') + '</strong>');
					} else {
						options.suggestionsElement.append('<strong class="text-warning"><i class="far fa-triangle-exclamation mr-3"></i>' + getResource('message.needsConfirm') + '</strong>');
					}
					if(options.buttonElement) {
						$(options.buttonElement).prop('disabled', false);
					} else if(options.buttonCallback) {
						options.buttonCallback(false);
					}
					return;
				} else {
					if (data.message) {
						options.suggestionsElement.append('<strong id="passwordPolicysMessage" class="error"><i class="far fa-circle-exclamation mr-3"></i>' + data.message + '</strong>');
					} else {
						options.suggestionsElement.append('<strong class="error"><i class="far fa-circle-exclamation mr-3"></i>' + getResource('message.doesNotConform') + '</strong>');
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
	
	var makeExpandable = function(el, content) {
        el.off('click').on('click', function(e) {
            e.preventDefault();
            content.toggle();
            if($('#' + content.attr('id') + ':visible').length != 0){
                $(this).find('i').removeClass('fa');
                $(this).find('i').removeClass('fa-plus');
                
                $(this).find('i').addClass('fa');
                $(this).find('i').addClass('fa-minus');
            }else{
                $(this).find('i').removeClass('fa');
                $(this).find('i').removeClass('fa-minus');
                
                $(this).find('i').addClass('fa');
                $(this).find('i').addClass('fa-plus');
            }
        });  
    };
	
	var executeWithDelay = function() {
        if(options.alternativeUi) {
            if(options.confirmElement.attr('type') === 'text') {
                options.confirmElement.attr('type', 'password');
                options.confirmElement.val('');
            }
            options.passwordElement.attr('type', 'password');
        } 		
		if(options.timeout) {
			clearTimeout(options.timeout);
		}
		options.timeout = setTimeout(validate, 500);
	}
	
	if(options.passwordElement) {
        if(!options.suggestionsElement) {
           options.suggestionsElement = $('<div id="suggestions" class="mb-3"></div>');
		   thisDiv.prepend(options.suggestionsElement);
		}
		$(options.passwordElement).off('keyup').on('keyup', executeWithDelay);
		$(options.confirmElement).off('keyup').on('keyup', executeWithDelay);
		
		if(options.alternativeUi) {
            $(options.confirmElement).off('focus').on('focus', function() {
                if($(this).attr('type') === 'text')
                    $(this).select();
            });
            $(options.passwordElement).off('focus').on('focus', function() {
                if($(this).attr('type') === 'text')
                    $(this).select();
            });
            var parent = $(options.passwordElement).parent();
            if(parent.hasClass('input-group'))
                /* Cleanup previous instance */
                parent.find('.input-group-text').remove();
            else
                parent.addClass('input-group');
            var ig = $('<span class="input-group-text"><a id="regeneratePassword" href="#" class="mr-3"><i class="far fa-refresh"></i></a><a id="copyPassword" class="copyPassword" href="#"><i class="far fa-copy"></i></a></span>'); 
            ig.insertAfter($(options.passwordElement));
            
            /* Special case, if the next sibling contains a help block, 
            then shift this into it's own row. */
            var next = ig.next(); 
            if(next.find('.lb-help-block').length > 0) {
                var newRow = parent.clone();
                newRow.empty();
                newRow.insertAfter(parent);
                next.appendTo(newRow);
                
                /* Also copy the label column (if one exists) and 
                   empty it of content to align the help block */
                var prev = parent.prev();
                if(prev.hasClass('control-label')) {
                    var newLabel = prev.clone();
                    newLabel.empty();
                    newLabel.removeClass('requiredField');
                    newLabel.attr('localize', '');
                    newLabel.insertAfter(parent);
                }
            }
        }
	}

	
	getJSON(url, null, function(data) {

		if(!data.success) {
			var passwordRulesContent;
			var passwordRulesExpander;
			if(options.showRulesDefault){
				passwordRulesExpander = $('<a class="lb-detail-icon" href="javascript:"><i class="far fa-minus mr-3"></i>' + options.title + '</a>');
				passwordRulesContent = $('<div id="passwordRulesContent" class="ml-3 mt-3"></div>');
			}else{
				passwordRulesExpander = $('<a class="lb-detail-icon" href="javascript:"><i class="far fa-minus mr-3"></i>' + options.title + '</a>');
				passwordRulesContent = $('<div id="passwordRulesContent" class="ml-3 mt-3"></div>');
			}
			var passwordRulesCol = $('<div class="' + options.columnStyle + '">');
			passwordRulesCol.append(passwordRulesExpander);
            passwordRulesCol.append(passwordRulesContent);
            thisDiv.append(passwordRulesCol);
            makeExpandable(passwordRulesExpander, passwordRulesContent);
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
            var passwordRulesExpander;
			if(options.showRulesDefault){
				if(options.showPolicyName)
                    passwordRulesExpander = $('<a class="lb-detail-icon" href="javascript:"><i class="far fa-minus mr-3"></i>' + policy.name + '</a>');
				else
                    passwordRulesExpander = $('<a class="lb-detail-icon" href="javascript:"><i class="far fa-minus mr-3"></i>' + options.title + '</a>');
				passwordRulesContent = $('<div id="passwordRulesContent" class="ml-3 mt-3 "></div>');
			}else{
				if(options.showPolicyName)
					passwordRulesExpander = $('<a class="lb-detail-icon" href="javascript:"><i class="far fa-plus mr-3"></i>' + policy.name + '</a>');
				else
					passwordRulesExpander = $('<a class="lb-detail-icon" href="javascript:"><i class="far fa-plus mr-3"></i>' + options.title + '</a>');
				passwordRulesContent = $('<div id="passwordRulesContent" class="ml-3 mt-3" style="display: none;"></div>');
			}
			
            var passwordRulesCol = $('<div class="' + options.columnStyle + '">');
            passwordRulesCol.append(passwordRulesExpander);
            passwordRulesCol.append(passwordRulesContent);
            thisDiv.append(passwordRulesCol);
            makeExpandable(passwordRulesExpander, passwordRulesContent);

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
        
		if(options.showGenerator && policy) {
			function customPassword(policy) {
			  var password = "";
			  
			  while (!isStrongEnough(password, policy, false)) {
			    password = generatePassword(policy.minimumLength + (policy.minimumLength / 2), false, new RegExp("[\\w\\d" + RegExp.escape(policy.validSymbols) + "]"));
			    log('Generated ' + password);
			  }
			  return password;
			}

			var passwordGeneratorContent;
			var passwordGeneratorExpander;
			var gentxt = getResource(options.alternativeUi ?  'passwordGenerator.options' : 'passwordGenerator.text'); 
			if(options.showGeneratorDefault){
				passwordGeneratorExpander = $('<a class="lb-detail-icon" href="javascript:"><i class="far fa-minus mr-3"></i>' + gentxt + '</a>');
				passwordGeneratorContent = $('<div id="passwordGeneratorContent" class="ml-3"></div>');
			} else {
				passwordGeneratorExpander = $('<a class="lb-detail-icon" href="javascript:"><i class="far fa-plus mr-3"></i>' + gentxt + '</a>');
				passwordGeneratorContent = $('<div id="passwordGeneratorContent" class="ml-3" style="display: none;"></div>');
			}
			
            var passwordGeneratorCol = $('<div class="' + options.columnStyle + '">');
            passwordGeneratorCol.append(passwordGeneratorExpander);
            passwordGeneratorCol.append(passwordGeneratorContent);
            thisDiv.append(passwordGeneratorCol);
            makeExpandable(passwordGeneratorExpander, passwordGeneratorContent);
			
            if(!options.alternativeUi) {			
    			passwordGeneratorContent.append('<div><span><strong>' 
    					+ getResource("suggestedPassword.text")
    					+ '</strong></span></div>');
    
                passwordGeneratorContent.append('<div id="generatedPassword" class="mt-3"><div id="passwordHolder" class="mb-4"><h5 id="suggestedPassword" class="text-success"></h5></div><a href="javascript:" class="mr-3" id="regeneratePassword"><i class="far fa-2x fa-refresh"></i></a></div>');
    		}
    		$('#regeneratePassword').attr('data-toggle', 'tooltip');
            $('#regeneratePassword').attr('data-placement', 'top');
            $('#regeneratePassword').attr('title', getResource("regeneratePassword.text"));
    		
    		$('#regeneratePassword').off('click').on('click', function(e) {
                e.preventDefault();
                getJSON('passwordPolicys/generate/' + policy.id + '/' + $('#passwordStrength').widget().getValue(), null, function(data) {
                    if(!data.success) {
                        showError(data.message);
                    } else {
                        if(options.alternativeUi) {
                            options.passwordElement.val(data.resource);
                            options.confirmElement.val(data.resource);
                            options.passwordElement.attr('type', 'text');
                            options.confirmElement.attr('type', 'text');
                            validate(); 
                        }
                        else {
                            options.passwordElement.attr('type', 'password');
                            options.confirmElement.attr('type', 'password');
                            $('#suggestedPassword').text(data.resource);
                        }
                    }
                });     
            });            
            passwordGeneratorContent.append('<div class="mt-2"><label>' + getResource('password.generate.length') + ':</label><span id="passwordStrength"></span></div>');
            
            $('#passwordStrength').spinnerInput({
                min: policy.minimumLength,
                max: policy.maximumLength,
                value: policy.minimumLength,
                changed: function(widget) {
                    $('#regeneratePassword').click();
                }
            });         
            $('#regeneratePassword').click();
			
			if(options.passwordElement && options.confirmElement) {
                
            
                if(!options.alternativeUi) {
    				$('#generatedPassword').append('<span>&nbsp;&nbsp;</span><a class="mr-3" href="javascript:" id="insertPassword" data-toggle="tooltip" data-offset="30" data-placement="top" title="'
    						 + getResource("injectCredentials.text") + '"><i class="far fa-2x fa-magic"></i></a>');
    				$('#insertPassword').off('click').on('click', function(e) {
    					e.preventDefault();
    					options.passwordElement.val($('#suggestedPassword').text());
    					options.confirmElement.val($('#suggestedPassword').text());
    					validate();
    				});
    				
    				
    				$('#generatedPassword').append('<span>&nbsp;&nbsp;</span><a id="copyPassword" href="javascript:" class="mr-3 copyPassword" "><i class="far fa-2x fa-copy"></i></a>');
                }
                $('#copyPassword').attr('data-toggle', 'tooltip');
                $('#copyPassword').attr('data-placement', 'top');
                $('#copyPassword').attr('title', getResource("copyCredentials.text"));
			
				var opts = {
				    text: function(e) {
                        return options.passwordElement ? options.passwordElement.val() : false;
				    }
				};
				
				if(options.bootstrapContainer) {
					opts.container = typeof options.bootstrapContainer === 'string' || options.bootstrapContainer instanceof String ? document.getElementById(options.bootstrapContainer) : options.bootstrapContainer;
				}
				
				// TODO not great, only allows for single instance, but we should never have more than one
				var oclipboard = $(document).data('copyPassword');
				if(oclipboard)
				    oclipboard.destroy();
				var clipboard = new ClipboardJS('#copyPassword', opts);
				$(document).data('copyPassword', clipboard);
				
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
