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

  // Radio Button Closer: Accordion (Ihre bestehende Logik)
  $("input:radio:checked").data("chk", true);
  $("input:radio").click(function() {
    // Ihre Logik, um das erneute Klicken zum Abwählen zu ermöglichen
    $("input[name='" + $(this).attr("name") + "']:radio").not(this).removeData("chk");
    $(this).data("chk", !$(this).data("chk"));
    $(this).prop("checked", $(this).data("chk"));
    // Der 'change'-Handler (unten hinzugefügt) wird die Label-Klassen aktualisieren
  });

  // ---- START: NEUER CODE für Akkordeon Plus/Minus Label Updater ----
  function updateAccordionLabels() {
    // Gehe durch jeden Radio-Button, der zum Akkordeon gehört (name="rdo")
    $('input[type="radio"][name="rdo"]').each(function() {
      var radioId = $(this).attr('id'); // z.B. "tog1"
      // Finde das zugehörige Label (hat Klasse "cat" und das 'for'-Attribut passend zur Radio-ID)
      var $label = $('label.cat[for="' + radioId + '"]');

      if ($label.length) { // Sicherstellen, dass das Label existiert
        if ($(this).is(':checked')) {
          // Wenn der Radio-Button ausgewählt ist, füge die Klasse 'expanded' zum Label hinzu
          $label.addClass('expanded');
        } else {
          // Sonst entferne die Klasse 'expanded'
          $label.removeClass('expanded');
        }
      }
    });
  }

  // Rufe die Funktion einmal beim Laden der Seite auf, um den initialen Zustand zu setzen
  updateAccordionLabels();

  // Füge einen Event-Listener hinzu, der die Funktion aufruft, wenn sich ein Akkordeon-Radio-Button ändert
  // Das 'change'-Event ist hier gut, da es nach der Zustandsänderung des Radio-Buttons feuert.
  $('input[type="radio"][name="rdo"]').on('change', function() {
    updateAccordionLabels();
  });
  // ---- ENDE: NEUER CODE für Akkordeon Plus/Minus Label Updater ----

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
  // HINWEIS: $(function() { ... }) ist $(document).ready().
  // window.onload feuert, NACHDEM alle Inhalte (inkl. Bilder) geladen sind.
  // Es ist generell besser, DOM-manipulierenden Code, der nicht auf das Laden aller Bilder etc.
  // warten muss, in $(document).ready() zu halten. Ihr Preloader ist in $(window).on('load'),
  // was korrekt ist, da er auf das Laden aller Ressourcen wartet.
  // Ihr Dark-Mode-Code kann hier bleiben, oder auch in $(function(){}) integriert werden,
  // falls er keine Abhängigkeit zum vollständigen Laden aller Bilder hat.

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
