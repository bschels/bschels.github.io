// Preloader
$(window).on('load', function() {
  $('#status').fadeOut();
  $('#preloader').delay(350).fadeOut('slow');
  $('body').delay(550).css({'overflow':'visible'});
});

// AJAX Loader für Content-Seiten
function ajaxLoad(target, url) {
  $.get(url, function(data) {
    $(target).html(data);
  });
}
function kb_source_2_datenschutz() { ajaxLoad('#datenschutz', '/pages/datenschutz.html'); }
function kb_source_2_impressum() { ajaxLoad('#impressum', '/pages/impressum.html'); }
function kb_source_2_cv() { ajaxLoad('#cv', '/pages/cv.html'); }
function kb_source_2_profil() { ajaxLoad('#profil', '/pages/profil.html'); }
function kb_source_2_leistungen() { ajaxLoad('#leistungen', '/pages/leistungen.html'); }
function kb_source_2_portfolio() { ajaxLoad('#projekte', '/pages/projekte.html'); }
function kb_source_2_bauenimbestand() { ajaxLoad('#bauenimbestand', '/pages/bauenimbestand.html'); }
function kb_source_2_design() { ajaxLoad('#design', '/pages/design.html'); }

// Sprachumschalter – neu und sicher!
$(document).ready(function() {
  $(".switch-language").on("click", function() {
    var switchTo = $(this).data("lang");
    $(".language-de, .language-en").removeClass("active");
    $(".language-" + switchTo).addClass("active");
  });

  // Lightbox-Hider auf Klick ins Overlay
  $('#fade').on('click', function() {
    $(".white_content, #fade").hide();
  });
});

// Radio Button Toggle – falls benötigt
$(document).ready(function(){
  $("input:radio:checked").data("chk",true);
  $("input:radio").click(function(){
    $("input[name='"+$(this).attr("name")+"']:radio").not(this).removeData("chk");
    $(this).data("chk",!$(this).data("chk"));
    $(this).prop("checked",$(this).data("chk"));
    // $(this).button('refresh'); // jQuery UI: falls genutzt, sonst raus
  });
});
