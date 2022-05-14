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

// theme switcher 


// dark mode

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

// color changer 
function getRandomColor() {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

const btn = document.getElementById("heart");

btn.addEventListener("click", () => {
document.documentElement.style.setProperty('--primary', getRandomColor());

});



