// AJAX Loader 

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
// Language switcher

$(document).ready(function() {
  $(".switch-language").on("click", function() {
    var switchTo = $(this).attr("id");
    $(".language").removeClass('active');
    $(".language#" + switchTo).addClass('active');
  });
});

// Lightbox close when click outside

$( '#fade, #close').on('click', function(event) {
    $("#impressum-p, #datenschutz-p, #fade").hide();
});

$( '#show').on('click', function(event) {
    $("#impressum-p, #datenschutz-p, #fade").show();
});
