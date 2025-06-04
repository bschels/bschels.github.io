// Globale Hilfsfunktion zum Laden von Lightbox-Inhalten via AJAX (ENTFERNT)
// function loadLightboxContent(pageFilename, targetElementId) { ... }

$(function() { // Entspricht $(document).ready()

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

  // Lightbox Hider on any click outside (ENTFERNT)
  // $('#fade').on('click', function(event) { ... });

  // --- START: Akkordeon Plus/Minus Label Updater Funktion ---
  function updateAccordionLabels() {
    // Wählt alle Radios, deren Name mit "rdo" beginnt (also rdo und rdo-sub)
    $('input[type="radio"][name^="rdo"]').each(function() {
      var radioId = $(this).attr('id');
      var $label = $('label.cat[for="' + radioId + '"]'); // Muss weiterhin die .cat Klasse haben

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

  // Radio Button Closer: Jetzt für Haupt- und Unterkategorien (name="rdo" und name="rdo-sub")
  // Initialisiere den "chk" Status basierend auf dem geladenen Zustand
  $('input[type="radio"][name^="rdo"]').each(function() {
    if ($(this).is(':checked')) {
      $(this).data("chk", true);
    }
  });

  $('input[type="radio"][name^="rdo"]').click(function() {
    var $clickedRadio = $(this);
    var radioName = $clickedRadio.attr("name");

    // Überprüfe, ob der angeklickte Radio-Button bereits gecheckt war (durch das .data("chk") markiert)
    if ($clickedRadio.data("chk")) {
        // Wenn er gecheckt war, mache ihn ungecheckt und setze den chk-Status zurück
        $clickedRadio.prop("checked", false).removeData("chk");
    } else {
        // Wenn er nicht gecheckt war, setze alle anderen Radios in dieser Gruppe auf ungecheckt
        $('input[type="radio"][name="' + radioName + '"]').not($clickedRadio).prop("checked", false).removeData("chk");
        // Setze den geklickten Radio-Button auf gecheckt und markiere den chk-Status
        $clickedRadio.prop("checked", true).data("chk", true);
    }

    // Akkordeon-Label-Zustand direkt nach der Änderung aktualisieren
    updateAccordionLabels();
  });

  // Rufe die Funktion einmal beim Laden der Seite auf, um den initialen Zustand korrekt zu setzen
  updateAccordionLabels();

  // AJAX Loader Funktionen - jetzt unter Verwendung der Hilfsfunktion loadLightboxContent (ENTFERNT)
  // Die Funktionen werden global im window-Objekt zugänglich gemacht für onclick-Attribute im HTML (ENTFERNT)
  // window.kb_source_2_datenschutz = function() { loadLightboxContent('datenschutz', 'datenschutz'); };
  // ... und alle anderen kb_source_2_... Funktionen

  // Dark-Mode Logik (bleibt unverändert)
  var toggle = document.getElementById("theme-toggle"); // Beachte: Dein HTML hat keinen 'theme-toggle' Button mehr
  var storedTheme = localStorage.getItem('theme') || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  if (storedTheme) {
    document.documentElement.setAttribute('data-theme', storedTheme);
  }
  if (toggle) { // Dieser Block wird nur ausgeführt, wenn #theme-toggle existiert
    toggle.onclick = function() {
      var currentTheme = document.documentElement.getAttribute("data-theme");
      var targetTheme = (currentTheme === "light") ? "dark" : "light";
      document.documentElement.setAttribute('data-theme', targetTheme);
      localStorage.setItem('theme', targetTheme);
    };
  }

}); // Ende von $(function() { ... })
