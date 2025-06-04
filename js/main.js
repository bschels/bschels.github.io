// Globale Hilfsfunktion zum Laden von Lightbox-Inhalten via AJAX
function loadContent(pageFilename, targetElementId) {
  $.get('/pages/' + pageFilename + '.html')
    .done(function(data) {
      $('#' + targetElementId).html(data);
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
      console.error("Failed to load content for: " + pageFilename, textStatus, errorThrown);
      $('#' + targetElementId).html('<p>Error loading content. Please try again later.</p>');
    });
}

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
  $('input[type="radio"][name="rdo"]').each(function() {
      $(this).data("chk", $(this).is(':checked')); // Initialize data-chk
  });
  $('input[type="radio"][name="rdo"]').on('click', function() {
    var $clickedRadio = $(this);
    var wasChecked = $clickedRadio.data("chk");

    // Deselect all other radio buttons in the group
    $('input[type="radio"][name="rdo"]').not($clickedRadio).prop("checked", false).data("chk", false);

    // Toggle the clicked radio button
    $clickedRadio.prop("checked", !wasChecked);
    $clickedRadio.data("chk", !wasChecked);

    // Akkordeon-Label-Zustand direkt nach der Änderung aktualisieren
    updateAccordionLabels();
  });

  // Rufe die Funktion einmal beim Laden der Seite auf, um den initialen Zustand korrekt zu setzen
  updateAccordionLabels();

  // Accordion for subcategories (Vita, Büroprofil, Leistungen, Schwerpunkte, Projekte)
  $('.accordion-sub-toggle').on('click', function(event) {
    event.preventDefault(); // Prevent default link behavior

    var $this = $(this);
    var pageFilename = $this.data('page');
    var targetElementId = $this.data('target-id');
    var $targetContent = $('#' + targetElementId);
    var $arrowIcon = $this.find('.arrow');

    // Close all other open accordion sub-contents and reset their arrows
    $('.accordion-content.active').not($targetContent).removeClass('active').html('');
    $('.accordion-sub-toggle .arrow.expanded').not($arrowIcon).removeClass('expanded');

    if ($targetContent.hasClass('active')) {
      // If currently active, close it
      $targetContent.removeClass('active').html('');
      $arrowIcon.removeClass('expanded');
    } else {
      // If not active, open it and load content
      loadContent(pageFilename, targetElementId);
      $targetContent.addClass('active');
      $arrowIcon.addClass('expanded');
    }
  });


  // Lightbox functions (Impressum, Datenschutz) - these remain as lightboxes
  window.kb_source_2_datenschutz = function() { loadContent('datenschutz', 'datenschutz'); document.getElementById('datenschutz-p').style.display='block';document.getElementById('fade').style.display='block'; };
  window.kb_source_2_impressum = function() { loadContent('impressum', 'impressum'); document.getElementById('impressum-p').style.display='block';document.getElementById('fade').style.display='block'; };

  // Dark-Mode Logik
  var toggle = document.getElementById("theme-toggle"); // Assuming this toggle exists somewhere in the HTML
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
