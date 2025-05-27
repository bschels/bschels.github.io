$(function() {
  // Preloader
  $(window).on('load', function() {
    $('#status').fadeOut();
    $('#preloader').delay(350).fadeOut('slow');
    $('body').delay(550).css({'overflow':'visible'});
  });

  // Language switcher
  $(".switch-language").on("click", function() {
    var switchTo = $(this).attr("id");
    $(".language").removeClass('active');
    $(".language#" + switchTo).addClass('active');
  });

  // Lightbox Hider on any click outside
  $('#fade').on('click', function(event) {
    $(".white_content, #fade").hide();
  });

  // Radio Button Closer: Accordion
  $("input:radio:checked").data("chk", true);
  $("input:radio").click(function() {
    $("input[name='" + $(this).attr("name") + "']:radio").not(this).removeData("chk");
    $(this).data("chk", !$(this).data("chk"));
    $(this).prop("checked", $(this).data("chk"));
  });

  // AJAX Loader
  window.kb_source_2_datenschutz = function() {
    $.get('/pages/datenschutz.html', function(data) {
      $('#datenschutz').html(data);
    });
  };
  window.kb_source_2_impressum = function() {
    $.get('/pages/impressum.html', function(data) {
      $('#impressum').html(data);
    });
  };
  window.kb_source_2_cv = function() {
    $.get('/pages/cv.html', function(data) {
      $('#cv').html(data);
    });
  };
  window.kb_source_2_profil = function() {
    $.get('/pages/profil.html', function(data) {
      $('#profil').html(data);
    });
  };
  window.kb_source_2_leistungen = function() {
    $.get('/pages/leistungen.html', function(data) {
      $('#leistungen').html(data);
    });
  };
  window.kb_source_2_portfolio = function() {
    $.get('/pages/projekte.html', function(data) {
      $('#projekte').html(data);
    });
  };
  window.kb_source_2_bauenimbestand = function() {
    $.get('/pages/bauenimbestand.html', function(data) {
      $('#bauenimbestand').html(data);
    });
  };
  window.kb_source_2_design = function() {
    $.get('/pages/design.html', function(data) {
      $('#design').html(data);
    });
  };
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
