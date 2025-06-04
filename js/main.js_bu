// Globale Hilfsfunktion zum Laden von Lightbox-Inhalten via AJAX
function loadLightboxContent(pageFilename, targetElementId) {
  $.get('/pages/' + pageFilename + '.html', function(data) {
    $('#' + targetElementId).html(data);
  });
}

$(function() { // Entspricht $(document).ready()

  // Preloader
  $(window).on('load', function() { // Bleibt auf $(window).on('load', ...) für Preloader-Logik
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
  function updateAccordionLabels() {
    $('input[type="radio"][name="rdo"]').each(function() {
      var radioId = $(this).attr('id');
      var $label = $('label.cat[for="' + radioId + '"]');
      if ($label.length) {
        if ($(this).is(':checked')) {
          $label.addClass('expanded');
        } else {
          $label.removeClass('expanded');
        }
      }
    });
  }
  // --- ENDE: Akkordeon Plus/Minus Label Updater Funktion ---

  // Radio Button Closer: Nur für Akkordeon-Radio-Buttons (name="rdo")
  $('input[type="radio"][name="rdo"]:checked').data("chk", true); // Initial für bereits ausgewählte Akkordeon-Radios
  $('input[type="radio"][name="rdo"]').click(function() { // Gilt jetzt nur für Radio-Buttons mit name="rdo"
    var $clickedRadio = $(this);
    var radioName = $clickedRadio.attr("name"); // Wird "rdo" sein

    // Logik, um das erneute Klicken zum Abwählen zu ermöglichen
    // .not($clickedRadio) stellt sicher, dass andere Radio-Buttons in der Gruppe nicht beeinflusst werden,
    // was bei name="rdo" (wo nur einer aktiv sein kann oder keiner durch diese Logik) ohnehin der Fall ist.
    // Die Hauptsache ist, das 'chk'-Datum für den geklickten zu toggeln.
    $("input[name='" + radioName + "']:radio").not($clickedRadio).removeData("chk"); // Andere in der Gruppe 'rdo' (falls Logik erweitert würde)
    $clickedRadio.data("chk", !$clickedRadio.data("chk"));
    $clickedRadio.prop("checked", $clickedRadio.data("chk"));

    // Akkordeon-Label-Zustand direkt nach der Änderung aktualisieren
    updateAccordionLabels();
  });

  // Rufe die Funktion einmal beim Laden der Seite auf, um den initialen Zustand korrekt zu setzen
  updateAccordionLabels();

  // AJAX Loader Funktionen - jetzt unter Verwendung der Hilfsfunktion loadLightboxContent
  // Die Funktionen werden global im window-Objekt zugänglich gemacht für onclick-Attribute im HTML
  window.kb_source_2_datenschutz = function() { loadLightboxContent('datenschutz', 'datenschutz'); };
  window.kb_source_2_impressum = function() { loadLightboxContent('impressum', 'impressum'); };
  window.kb_source_2_cv = function() { loadLightboxContent('cv', 'cv'); };
  window.kb_source_2_profil = function() { loadLightboxContent('profil', 'profil'); };
  window.kb_source_2_leistungen = function() { loadLightboxContent('leistungen', 'leistungen'); };
  window.kb_source_2_portfolio = function() { loadLightboxContent('projekte', 'projekte'); }; // Lädt projekte.html in #projekte
  window.kb_source_2_bauenimbestand = function() { loadLightboxContent('bauenimbestand', 'bauenimbestand'); };
  window.kb_source_2_design = function() { loadLightboxContent('design', 'design'); };

  // Dark-Mode Logik (vorher in window.onload)
  var toggle = document.getElementById("theme-toggle");
  var storedTheme = localStorage.getItem('theme') || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  if (storedTheme) {
    document.documentElement.setAttribute('data-theme', storedTheme);
  }
  if (toggle) {
    toggle.onclick = function() {
      var currentTheme = document.documentElement.getAttribute("data-theme");
      var targetTheme = (currentTheme === "light") ? "dark" : "light";
      document.documentElement.setAttribute('data-theme', targetTheme);
      localStorage.setItem('theme', targetTheme);
    };
  }

}); // Ende von $(function() { ... })

// Das separate window.onload für den Dark-Mode wird nicht mehr benötigt,
// da die Logik oben in $(function(){}) integriert wurde.
// window.onload = function() { ... }; // ALT, kann entfernt werden, wenn Dark-Mode das Einzige darin war.
