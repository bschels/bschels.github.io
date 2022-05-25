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
function kb_source_2_profil() {
		$.get('/pages/profil.html', function(data) {
			$('#profil').html(data);	
		})
	}
function kb_source_2_portfolio() {
		$.get('/pages/projekte.html', function(data) {
			$('#projekte').html(data);	
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
	
//alt: dark colors
//let color = "#";
//for (let i = 0; i < 3; i++)
//color += ("0" + Math.floor(Math.random() * Math.pow(16, 2) / 2).toString(16)).slice(-2);
//alt: all colors
//var letters = "0123456789ABCDEF";
//var color = "#";
//for (var i = 0; i < 6; i++) {
//color += letters[Math.floor(Math.random() * 16)];
	
//nice color
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


// Checkbox closer
var checkbox = document.querySelector('#tog1');
var icon = document.querySelector('#content1');
var listener = function( e ) {
  if( e.target != checkbox && e.target != icon ) {
    checkbox.checked = false;
    document.removeEventListener( 'click', listener );
  }
};

checkbox.addEventListener( 'click', function(){
  if( this.checked ) {
    document.addEventListener( 'click', listener );
  } 
});

// Lightbox hider
$(document).on('click', function(event) {
    if ($(event.target).has('.black_overlay').length) {
        $(".lightbox").hide();
    }
});
