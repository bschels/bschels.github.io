//Preloader
		$(window).on('load', function() { // makes sure the whole site is loaded 
			$('#status').fadeOut(); // will first fade out the loading animation 
            $('#preloader').delay(350).fadeOut('slow'); // will fade out the white DIV that covers the website. 
            $('body').delay(550).css({'overflow':'visible'});
		})

// AJAX Load
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
function kb_source_2_profil() {
		$.get('/pages/profil.html', function(data) {
			$('#profil').html(data);	
		})

}
function kb_source_2_leistungen() {
		$.get('/pages/leistungen.html', function(data) {
			$('#leistungen').html(data);	
		})

	}
function kb_source_2_portfolio() {
		$.get('/pages/projekte.html', function(data) {
			$('#projekte').html(data);	
		})
	}
function kb_source_2_bauenimbestand() {
		$.get('/pages/bauenimbestand.html', function(data) {
			$('#bauenimbestand').html(data);	
		})
	}
function kb_source_2_design() {
		$.get('/pages/design.html', function(data) {
			$('#design').html(data);	
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
// dark_mode 
window.onload = function(){ 
var toggle = document.getElementById("theme-toggle");
	
var storedTheme = localStorage.getItem('theme') || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
if (storedTheme)
    document.documentElement.setAttribute('data-theme', storedTheme)
toggle.onclick = function() {
    var currentTheme = document.documentElement.getAttribute("data-theme");
    var targetTheme = "light";
    if (currentTheme === "light") {
        targetTheme = "dark";
    }
	
    document.documentElement.setAttribute('data-theme', targetTheme)
    localStorage.setItem('theme', targetTheme);
};
};

// color switcher
function getRandomColor() {
var letters = "0123456789ABCDEF";
var color = "#";
for (var i = 0; i < 6; i++) {
color += letters[Math.floor(Math.random() * 13)];
}
return color;
};
// Get the root element
var r = document.querySelector(':root');
// Create a function for setting a variable value
function myFunction_set() {
  // Set the value of variable -- to another value
  r.style.setProperty('--primary_r', getRandomColor());
}
function darkmode() {
    var currentTheme = document.documentElement.getAttribute("data-theme");
    var targetTheme = "light";
    if (currentTheme === "light") {
        targetTheme = "dark";
    }
	
    document.documentElement.setAttribute('data-theme', targetTheme)
};

//Lightbox Hider on any click outside

$("#fade").on("click", function(event) {
    $("#profil-p, #fade").hide();
});
