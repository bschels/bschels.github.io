// Sprachumschalter (funktioniert global & auch in Lightbox)
$(document).ready(function () {
  $(".switch-language").on("click", function () {
    var lang = $(this).data("lang");
    $(".language").removeClass("active");
    $(".language-" + lang).addClass("active");
    $(".switch-language").removeClass("active");
    $('.switch-language[data-lang="' + lang + '"]').addClass("active");

    // Lightbox: Inhalt in neuer Sprache laden
    $('.white_content:visible').each(function () {
      var lb = $(this);
      var contentDiv = lb.find('.lightbox');
      if (contentDiv.length) {
        var parentId = lb.attr('id');
        var map = {
          'cv-p':      {de: '/pages/cv.html',          en: '/pages/cv_en.html'},
          'profil-p':  {de: '/pages/profil.html',      en: '/pages/profil_en.html'},
          'leistungen-p': {de: '/pages/leistungen.html', en: '/pages/leistungen_en.html'},
          'bauenimbestand-p': {de: '/pages/bauenimbestand.html', en: '/pages/bauenimbestand_en.html'},
          'projekte-p': {de: '/pages/projekte.html',   en: '/pages/projekte_en.html'},
          'impressum-p': {de: '/pages/impressum.html', en: '/pages/impressum_en.html'},
          'datenschutz-p': {de: '/pages/datenschutz.html', en: '/pages/datenschutz_en.html'}
        };
        if (map[parentId] && map[parentId][lang]) {
          contentDiv.load(map[parentId][lang]);
        }
      }
    });
  });

  // Overlay schließt alle Lightboxen
  $('#fade').on('click', function () {
    $(".white_content, #fade").hide();
  });

  // Kategorie-Accordion: Togglebar statt reines Radio
  $('label.cat').each(function () {
    var input = $('#' + $(this).attr('for'));
    var self = $(this);
    self.on('click', function (e) {
      // Timeout damit das Öffnen durch das Radio-Click vorher ausgeführt wird
      setTimeout(function () {
        if (input.prop('checked')) {
          if (self.hasClass('was-open')) {
            input.prop('checked', false);
            self.removeClass('was-open');
          } else {
            $('label.cat').removeClass('was-open');
            self.addClass('was-open');
          }
        } else {
          self.removeClass('was-open');
        }
      }, 1);
    });
  });
});

// AJAX Loader für Lightbox-Inhalte
function ajaxLoad(target, url) {
  $.get(url, function (data) {
    $(target).html(data);
  });
}
function kb_source_2_datenschutz() { ajaxLoad('#datenschutz', '/pages/datenschutz.html'); }
function kb_source_2_impressum()   { ajaxLoad('#impressum',   '/pages/impressum.html'); }
function kb_source_2_cv()          { ajaxLoad('#cv',          '/pages/cv.html'); }
function kb_source_2_profil()      { ajaxLoad('#profil',      '/pages/profil.html'); }
function kb_source_2_leistungen()  { ajaxLoad('#leistungen',  '/pages/leistungen.html'); }
function kb_source_2_portfolio()   { ajaxLoad('#projekte',    '/pages/projekte.html'); }
function kb_source_2_bauenimbestand() { ajaxLoad('#bauenimbestand', '/pages/bauenimbestand.html'); }
