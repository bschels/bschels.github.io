// Global helper function to load content via AJAX
function loadContent(pageFilename, targetElementId, callback) {
  var cacheBuster = "?_t=" + new Date().getTime();
  $.get('/pages/' + pageFilename + '.html' + cacheBuster)
    .done(function(data) {
      $('#' + targetElementId).html(data);
      if (typeof callback === 'function') {
        callback();
      }
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
      console.error("Failed to load content for: " + pageFilename, textStatus, errorThrown);
      $('#' + targetElementId).html('<p>Error loading content. Please try again later.</p>');
      if (typeof callback === 'function') {
        callback();
      }
    });
}

$(function() {
  $(window).on('load', function() {
    $('#status').fadeOut();
    $('#preloader').delay(350).fadeOut('slow');
    $('body').delay(550).css({'overflow':'visible'});
  });

  // Language switcher
  $(document).on("click", ".switch-language", function(e) {
    e.preventDefault();
    var switchTo = $(this).data("lang") || $(this).attr("id");
    $(".language").removeClass('active');
    $(".language#" + switchTo).addClass('active');
    $(".switch-language").removeClass('active-lang-link');
    $('.switch-language[data-lang="' + switchTo + '"], .switch-language#' + switchTo).addClass('active-lang-link');
    // Update HTML lang attribute
    document.documentElement.setAttribute('lang', switchTo === 'german' ? 'de' : 'en');
  });

  var initialActiveLangId = $('.language.active').attr('id');
  if (initialActiveLangId) {
    $('.switch-language[data-lang="' + initialActiveLangId + '"], .switch-language#' + initialActiveLangId).addClass('active-lang-link');
  }

  $('#fade').on('click', function() {
    $(".white_content, #fade").hide();
  });

  function updateAccordionLabels() {
    $('input[type="radio"][name="rdo"]').each(function() {
      var radioId = $(this).attr('id');
      var $label = $('label.cat[for="' + radioId + '"]');
      if ($label.length) {
        if ($(this).is(':checked')) {
          $label.addClass('expanded').attr('aria-expanded', 'true');
        } else {
          $label.removeClass('expanded').attr('aria-expanded', 'false');
        }
      }
    });
  }

  // Keyboard navigation for accordions
  $('label.cat[for^="tog"]').on('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      $(this).click();
    }
  });

  $('input[type="radio"][name="rdo"]').each(function() {
    $(this).data("chk", $(this).is(':checked'));
  });

  $('input[type="radio"][name="rdo"]').on('click', function() {
    var $clickedRadio = $(this);
    var wasChecked = $clickedRadio.data("chk");
    $('input[type="radio"][name="rdo"]').not($clickedRadio).prop("checked", false).data("chk", false);
    $clickedRadio.prop("checked", !wasChecked);
    $clickedRadio.data("chk", !wasChecked);
    updateAccordionLabels();

    // Auto-load content for accordion sections with data-auto-load
    if (!wasChecked) {
      var contentId = $clickedRadio.attr('id').replace('tog', 'content');
      var $content = $('#' + contentId);
      var $autoLoadElement = $content.find('[data-auto-load="true"]');
      if ($autoLoadElement.length && !$autoLoadElement.data('loaded')) {
        var pageFilename = $autoLoadElement.data('page');
        var targetElementId = $autoLoadElement.attr('id');
        loadContent(pageFilename, targetElementId, function() {
          $autoLoadElement.data('loaded', true);
        });
      }
    }
  });

  updateAccordionLabels();

  // CTA-Links: Öffnet das entsprechende Akkordeon und scrollt dorthin
  $(document).on('click', 'a[href^="#tog"]', function(e) {
    e.preventDefault();
    var targetId = $(this).attr('href').substring(1); // z.B. "tog5"
    var $targetRadio = $('#' + targetId);
    if ($targetRadio.length) {
      // Alle anderen schließen
      $('input[type="radio"][name="rdo"]').not($targetRadio).prop("checked", false).data("chk", false);
      // Dieses öffnen
      $targetRadio.prop("checked", true).data("chk", true);
      updateAccordionLabels();
      // Zum Akkordeon scrollen
      var $label = $('label.cat[for="' + targetId + '"]');
      if ($label.length) {
        $('html, body').animate({
          scrollTop: $label.offset().top - 20
        }, 400);
      }
    }
  });

// Close lightbox handlers
  function closeLightbox(lightboxId) {
    document.getElementById(lightboxId).style.display = 'none';
    document.getElementById('fade').style.display = 'none';
  }

  // Open lightbox handlers
  window.kb_source_2_datenschutz = function() {
    loadContent('datenschutz', 'datenschutz');
    document.getElementById('datenschutz-p').style.display = 'block';
    document.getElementById('fade').style.display = 'block';
  };

  window.kb_source_2_impressum = function() {
    loadContent('impressum', 'impressum');
    document.getElementById('impressum-p').style.display = 'block';
    document.getElementById('fade').style.display = 'block';
  };

  // Replace inline onclick handlers with event listeners
  $(document).on('click', '[data-close-lightbox]', function(e) {
    e.preventDefault();
    var lightboxId = $(this).data('close-lightbox');
    closeLightbox(lightboxId);
  });

  $(document).on('click', '[data-open-impressum]', function(e) {
    e.preventDefault();
    kb_source_2_impressum();
  });

  $(document).on('click', '[data-open-datenschutz]', function(e) {
    e.preventDefault();
    kb_source_2_datenschutz();
  });

  // Kontaktformular AJAX-Absendung
  $('.contact-form').on('submit', function(e) {
    e.preventDefault();
    
    var $form = $(this);
    var $section = $form.closest('.contact-form-section');
    var $successMsg = $section.find('.form-success');
    var $submitBtn = $form.find('.form-submit');
    var originalBtnText = $submitBtn.text();
    
    // Button deaktivieren und Text ändern
    $submitBtn.prop('disabled', true).text('...');
    
    // Formular per AJAX absenden
    $.ajax({
      url: $form.attr('action'),
      method: 'POST',
      data: $form.serialize(),
      dataType: 'json',
      success: function() {
        // Formular ausblenden, Erfolgsmeldung einblenden
        $form.fadeOut(300, function() {
          $successMsg.fadeIn(300);
        });
      },
      error: function(xhr) {
        // Bei Erfolg (Formspree gibt manchmal 200 als error zurück)
        if (xhr.status === 200 || xhr.status === 302) {
          $form.fadeOut(300, function() {
            $successMsg.fadeIn(300);
          });
        } else {
          // Echter Fehler
          alert('Es gab einen Fehler. Bitte versuchen Sie es erneut oder schreiben Sie direkt an hello@schels.info');
          $submitBtn.prop('disabled', false).text(originalBtnText);
        }
      }
    });
  });

});
