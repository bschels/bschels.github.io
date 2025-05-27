// Preloader
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

// Language switcher
$(document).ready(function() {
  $(".switch-language").on("click", function() {
    var switchTo = $(this).attr("id");
    $(".language").removeClass('active');
    $(".language#" + switchTo).addClass('active');
  });
});

// dark_mode 
window.onload = function() {
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

// Lightbox Hider on any click outside
$(document).ready(function() {
  $('#fade').on('click', function(event) {
    $(".white_content, #fade").hide();
  });	
});

// Radio Button Closer: Accordion-Handling für Öffnen/Schließen
$(document).ready(function(){
  $("input:radio:checked").data("chk",true);
  $("input:radio").click(function(){
    $("input[name='"+$(this).attr("name")+"']:radio").not(this).removeData("chk");
    $(this).data("chk",!$(this).data("chk"));
    $(this).prop("checked",$(this).data("chk"));
  });
});
