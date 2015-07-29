$.fn.stepForm = function(params) {
	
	var divName = $(this).attr('id');

	log("Creating step form for div " + divName);

	var options = $.extend({
	
	}, params);
	
	
	$(this).append('<div class="panel-group" id="' + divName + 'Accordion" role="tablist" aria-multiselectable="true"></div>');
	var stepCount = 0;
	
	$.each(options.steps, function() {
		
		var stepId = divName + 'Step' + stepCount;
		var collaspe = 'collaspe' + stepCount;
		$('#' + divName + "Accordion").append('<div class="panel panel-default">' +
				'<div class="panel-heading" role="tab" id="' + stepId + '">' +
					'<h4 class="panel-title">' +
						'<a role="button" class="stepCollaspe" data-toggle="collapse" data-parent="#accordion" href="#' + collaspe + '" aria-expanded="' + (stepCount == 0 ? 'true' : 'false') + '" aria-controls="' + collaspe + '">' + this.title + '</a>' +
					'</h4>' +
				'</div>' +
				'<div id="' + collaspe + '" class="panel-collapse collapse' + (stepCount == 0 ? 'in' : '') + '" role="tabpanel" aria-labelledby="' + stepId + '">' +
					'<div class="panel-body">' +
	      
					'</div>' +
				'</div>' +
			'</div>');
		stepCount++;
		
		$('.stepCollaspe').click(function(e) {
			e.preventDefault();
		});
	});
	  
	
};