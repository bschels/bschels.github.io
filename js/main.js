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
  });

  updateAccordionLabels();

  function generatePagination($contentContainer, totalPages, currentPageIndex) {
    if (totalPages <= 1) return; // 🔧 NEU: Kein Paginator bei nur einer Seite
    $contentContainer.find('.pagination-controls').remove();
    let paginationHtml = '<div class="pagination-controls">';
    for (let i = 0; i < totalPages; i++) {
      paginationHtml += `<a href="#" class="page-link ${i === currentPageIndex ? 'active' : ''}" data-page-index="${i}">${i + 1}</a>`;
    }
    paginationHtml += '</div>';
    $contentContainer.append(paginationHtml);
  }

  $('.accordion-sub-toggle').on('click', function(event) {
    event.preventDefault();
    var $this = $(this);
    var pageFilename = $this.data('page');
    var targetElementId = $this.data('target-id');
    var $targetContent = $('#' + targetElementId);
    var $arrowIcon = $this.find('.arrow');
    var $parentCatLink = $this.closest('.cat-link');

    $('.accordion-content.active').not($targetContent).css('max-height', '0px').removeClass('active').html('').css('overflow-y', 'hidden');
    $('.accordion-sub-toggle .arrow.expanded').not($arrowIcon).removeClass('expanded');
    $('.cat-link.active-sub-link').not($parentCatLink).removeClass('active-sub-link');

    if ($targetContent.hasClass('active')) {
      $targetContent.css('max-height', '0px').removeClass('active').html('').css('overflow-y', 'hidden');
      $arrowIcon.removeClass('expanded');
      $parentCatLink.removeClass('active-sub-link');
    } else {
      loadContent(pageFilename, targetElementId, function() {
        const $projectPages = $targetContent.find('.project-page');
        if ($projectPages.length > 0) {
          if ($projectPages.length > 1) {
            $projectPages.hide();
            $projectPages.first().show();
            generatePagination($targetContent, $projectPages.length, 0);
            $targetContent.off('click', '.pagination-controls .page-link').on('click', '.pagination-controls .page-link', function(e) {
              e.preventDefault();
              const pageIndex = $(this).data('page-index');
              $projectPages.hide();
              $projectPages.eq(pageIndex).show();
              $('.pagination-controls .page-link').removeClass('active');
              $(this).addClass('active');
              const currentPageElement = $projectPages.eq(pageIndex)[0];
              const currentProjectPageHeight = currentPageElement ? currentPageElement.scrollHeight : 0;
              const paginationHeight = $targetContent.find('.pagination-controls').outerHeight(true) || 0;
              $targetContent.css('max-height', (currentProjectPageHeight + paginationHeight + 20) + 'px');
              setTimeout(() => {
                $targetContent.css('overflow-y', 'auto');
              }, 500);
            });
          }
        }

        $targetContent.addClass('active');
        $targetContent.outerHeight();
        const contentHeight = $targetContent.prop('scrollHeight');
        $targetContent.css('max-height', contentHeight + 'px');
        setTimeout(function() {
          $targetContent.css('overflow-y', 'auto');
        }, 500);
      });
      $arrowIcon.addClass('expanded');
      $parentCatLink.addClass('active-sub-link');
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

  var toggle = document.getElementById("theme-toggle");
  var toggleText = document.getElementById("theme-toggle-text");
  var storedTheme = localStorage.getItem('theme') || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  if (storedTheme) {
    document.documentElement.setAttribute('data-theme', storedTheme);
    if (toggleText) {
      toggleText.textContent = storedTheme === "dark" ? "light" : "dark";
    }
  }
  if (toggle) {
    toggle.onclick = function() {
      var currentTheme = document.documentElement.getAttribute("data-theme");
      var targetTheme = (currentTheme === "light") ? "dark" : "light";
      document.documentElement.setAttribute('data-theme', targetTheme);
      localStorage.setItem('theme', targetTheme);
      if (toggleText) {
        toggleText.textContent = targetTheme === "dark" ? "light" : "dark";
      }
    };
  }
});
