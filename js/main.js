//Preloader
$(window).on('load', function() {
  $('#status').fadeOut();
  $('#preloader').delay(350).fadeOut('slow');
  $('body').delay(550).css({'overflow':'visible'});
});

// AJAX Load 
function kb_source_2_datenschutz() {
  $.get('/pages/datenschutz.html', function(data) {
    $('#datenschutz').html(data);	
  });
}
function kb_source_2_impressum() {
  $.get('/pages/impressum.html', function(data) {
    $('#impressum').html(data);	
  });
}
function kb_source_2_cv() {
  $.get('/pages/cv.html', function(data) {
    $('#cv').html(data);	
  });
}
function kb_source_2_profil() {
  $.get('/pages/profil.html', function(data) {
    $('#profil').html(data);	
  });
}
function kb_source_2_leistungen() {
  $.get('/pages/leistungen.html', function(data) {
    $('#leistungen').html(data);	
  });
}
function kb_source_2_portfolio() {
  $.get('/pages/projekte.html', function(data) {
    $('#projekte').html(data);	
  });
}
function kb_source_2_bauenimbestand() {
  $.get('/pages/bauenimbestand.html', function(data) {
    $('#bauenimbestand').html(data);	
  });
}
function kb_source_2_design() {
  $.get('/pages/design.html', function(data) {
    $('#design').html(data);	
  });
}

// Language switcher (using unique IDs)
$(document).ready(function() {
  $(".switch-language").on("click", function() {
    var switchTo = $(this).attr("id");
    // all "language" blocks in the DOM (with unique IDs)
    $(".language").removeClass('active');
    if (switchTo === "lang-german") {
      $(".language[id$='german']").addClass('active');
    } else if (switchTo === "lang-english") {
      $(".language[id$='english']").addClass('active');
    }
  });
});

// dark_mode 
window.onload = function(){ 
  // Darkmode via data-theme attribute on html
  var toggle = document.getElementById("theme-toggle");
  var storedTheme = localStorage.getItem('theme') || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  if (storedTheme)
    document.documentElement.setAttribute('data-theme', storedTheme);
  if(toggle){
    toggle.onclick = function() {
      var currentTheme = document.documentElement.getAttribute("data-theme");
      var targetTheme = (currentTheme === "light") ? "dark" : "light";
      document.documentElement.setAttribute('data-theme', targetTheme);
      localStorage.setItem('theme', targetTheme);
    };
  }
};

// color switcher (keine Verwendung im Frontend, bleibt als Funktion erhalten)
function getRandomColor() {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 13)];
  }
  return color;
}
var r = document.querySelector(':root');
function myFunction_set() {
  r.style.setProperty('--primary_r', getRandomColor());
}

// Lightbox Hider on any click outside
$(document).ready(function() {
  $('#fade').on('click', function(event) {
    $(".white_content, #fade").hide();
  });	
});

// Radio Button Closer: Accordion
$(document).ready(function(){
  $("input:radio:checked").data("chk",true);
  $("input:radio").click(function(){
    $("input[name='"+$(this).attr("name")+"']:radio").not(this).removeData("chk");
    $(this).data("chk",!$(this).data("chk"));
    $(this).prop("checked",$(this).data("chk"));
  });
});
