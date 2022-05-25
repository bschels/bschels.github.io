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
//// About

var checkbox1 = document.getElementById("tog1");
var icon1 = document.getElementById("content1");
var listener1 = function( e1 ) {
  if( e1.target != checkbox1 && e1.target != icon1 ) {
    checkbox1.checked = false;
    document.removeEventListener( 'click', listener1 );
  }
};

checkbox1.addEventListener( 'click', function(){
  if( this.checked ) {
    document.addEventListener( 'click', listener1 );
  } 
});

////Projekte

var checkbox2 = document.getElementById("tog3");
var icon2 = document.getElementById("content3");
var listener2 = function( e2 ) {
  if( e2.target != checkbox2 && e2.target != icon2 ) {
    checkbox2.checked = false;
    document.removeEventListener( 'click', listener2 );
  }
};

checkbox2.addEventListener( 'click', function(){
  if( this.checked ) {
    document.addEventListener( 'click', listener2 );
  } 
});

////Kontakt

var checkbox3 = document.getElementById("tog2");
var icon3 = document.getElementById("content2");
var listener3 = function( e3 ) {
  if( e3.target != checkbox3 && e3.target != icon3 ) {
    checkbox3.checked = false;
    document.removeEventListener( 'click', listener3 );
  }
};

checkbox3.addEventListener( 'click', function(){
  if( this.checked ) {
    document.addEventListener( 'click', listener3 );
  } 
});

//

