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

  // --- START: Akkordeon Plus/Minus Label Updater Funktion ---
  // Diese Funktion aktualisiert die 'expanded'-Klasse auf den Labels
  // basierend auf dem 'checked'-Status der zugehörigen Radio-Buttons.
  function updateAccordionLabels() {
    // console.log("updateAccordionLabels wird aufgerufen"); // Für Debugging-Zwecke
    $('input[type="radio"][name="rdo"]').each(function() {
      var radioId = $(this).attr('id');
      var $label = $('label.cat[for="' + radioId + '"]');

      if ($label.length) {
        if ($(this).is(':checked')) {
          // console.log("Label für " + radioId + " bekommt 'expanded'"); // Für Debugging
          $label.addClass('expanded');
        } else {
          // console.log("Label für " + radioId + " verliert 'expanded'"); // Für Debugging
          $label.removeClass('expanded');
        }
      }
    });
  }
  // --- ENDE: Akkordeon Plus/Minus Label Updater Funktion ---

  // Radio Button Closer: Accordion (Ihre bestehende Logik, leicht angepasst)
  $("input:radio:checked").data("chk", true); // Initial für bereits ausgewählte Radio-Buttons
  $("input:radio").click(function() {         // Gilt für ALLE Radio-Buttons auf der Seite
    var $clickedRadio = $(this); // jQuery-Objekt des geklickten Radio-Buttons
    var radioName = $clickedRadio.attr("name"); // Name des Radio-Buttons (z.B. "rdo")

    // Ihre ursprüngliche Logik, um das Abwählen per Klick zu ermöglichen
    $("input[name='" + radioName + "']:radio").not($clickedRadio).removeData("chk");
    $clickedRadio.data("chk", !$clickedRadio.data("chk"));
    $clickedRadio.prop("checked", $clickedRadio.data("chk"));

    // NEU: Wenn der geklickte Radio-Button zur Akkordeon-Gruppe "rdo" gehört,
    // dann rufe updateAccordionLabels auf, um die Plus-/Minus-Zeichen zu aktualisieren.
    if (radioName === "rdo") {
      updateAccordionLabels();
    }
  });

  // Rufe die Funktion einmal beim Laden der Seite auf, um den initialen Zustand korrekt zu setzen
  updateAccordionLabels();

  // Der separate 'change'-Listener für input[name="rdo"] ist jetzt nicht mehr unbedingt nötig,
  // da der .click()-Handler oben den Aufruf für die "rdo"-Gruppe übernimmt.
  // $('input[type="radio"][name="rdo"]').on('change', updateAccordionLabels); // Kann auskommentiert oder entfernt werden

  // AJAX Loader (Ihre bestehenden Funktionen)
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
}); // Ende von $(function() { ... })

// dark_mode (Ihre bestehende Funktion)
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
