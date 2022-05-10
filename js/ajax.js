function kb_source_2_datenschutz() {
		$.get('/pages/datenschutz.html', function(data) {
			$('#datenschutz').html(data);	
		})
	}
function kb_source_2_impressum() {
		$.get('/pages/impressum.html', function(data) {
			$('#impressum').html(data);	
		})
	}
function kb_source_2_cv() {
		$.get('/pages/cv.html', function(data) {
			$('#cv').html(data);	
		})
	}
