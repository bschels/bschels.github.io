function kb_source_2_datenschutz() {
		$.get('/pages/datenschutz.html', function(data) {
			$('#target').html(data);	
		})
	}
function kb_source_2_impressum() {
		$.get('/pages/impressum.html', function(data) {
			$('#target').html(data);	
		})
	}
function kb_source_2_cv() {
		$.get('/pages/cv.html', function(data) {
			$('#target').html(data);	
		})
	}
