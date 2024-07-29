function checkIsOnlyDefaultInterfacePresent(interfaces) {
	return interfaces && interfaces.length === 1 && interfaces[0].name === "Default HTTPS";
}
	
function getDefaultInterfaceId(interfaces) {
	if(interfaces && interfaces.length === 1) {
		return interfaces[0].id;
	}
	
	return -1;
}

function getSelectedCertificate(selectedInterface, tag) {
	const withTagId = (value) => '#' + value + tag;
	
	if (selectedInterface != -1) {
		const interfaces = $(withTagId('replaceDefault')).data('interfaces');
		
		if (interfaces) {
			const httpinterface = interfaces.find(v => v.id == selectedInterface);
			if (httpinterface && httpinterface.certificate) {
				const certificate = httpinterface.certificate;
				const certificateId = certificate.id;
				return certificateId;
			} else {
				showError("Problem finding certificate value.");
				return null;
			}
		} else {
			showError("Problem finding certificate value.");
			return null;
		}
	} 
	
	return -1;
}

function setUpReplaceDefaultSSLDropDown(interfaces, value, tag) {
		
	const withTagId = (value) => '#' + value + tag; 
		
	const values = [{id: -1, name: getResource('upload.select.doNotReplace')}].concat(interfaces);
	
	$(withTagId('replaceDefault')).data('interfaces', interfaces);
	$(withTagId('replaceDefault')).empty();
	$(withTagId('replaceDefault')).selectButton({
		options: values,
		nameAttr: 'name',
		valueAttr: 'id',
		value: value,
		changed: (widget) => {
			const selected = widget.getValue();
			$(withTagId('morePresentHelperMsg')).text('');
			if (selected != -1) {
				$(withTagId('busyIndicator')).show();
				getJSON('httpInterfaces/sameCertificate/' + selected, null, (data) => {
					$(withTagId('busyIndicator')).hide();
					if (data && data.success) {
						const interfaces = data.resources;
						if (interfaces) {
							let msg = '';
							if (interfaces.length > 0) {
								const names = interfaces.map((v) => v.name).join();
								msg = getResource('upload.moreInterfacePresent.certificate.use').format(names);
							} else {
								msg = getResource('upload.moreInterfacePresent.certificate.not.use');
							}
							
							$(withTagId('morePresentHelperMsg')).text(msg);
						}
					} else {
						showError("Problem in fetching certificate details for selected HTTP interface.");
						console.error(data.message);
					}
				});
			}
		}
	});
}

function showHideComponentsAsPerNumberOfHttpInterfaces(isOnlyDefaultInterfacePresent, tag) {
	
	const withTagId = (value) => '#' + value + tag; 
	
	if (isOnlyDefaultInterfacePresent) {
		$(withTagId('localizeOnlyDefaultPresentInfo')).show();
		$(withTagId('localizeOnlyDefaultPresentLabel')).show();
		$(withTagId('localizeMorePresentInfo')).hide();
		$(withTagId('localizeMorePresentlabel')).hide();
	} else {
		$(withTagId('localizeOnlyDefaultPresentInfo')).hide();
		$(withTagId('localizeOnlyDefaultPresentLabel')).hide();
		$(withTagId('localizeMorePresentlabel')).show();
		$(withTagId('localizeMorePresentInfo')).show();
	}
}