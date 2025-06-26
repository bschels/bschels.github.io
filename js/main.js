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
      $('#' + targetElementId).html('<p>Error loading content. Please try again später.</p>');
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

  $(document).on("click", ".switch-language", function() {
    var switchTo = $(this).data("lang");
    $(".language").removeClass('active');
    $(".language#" + switchTo).addClass('active');
    $(".switch-language").removeClass('active-lang-link');
    $('.switch-language[data-lang="' + switchTo + '"]').addClass('active-lang-link');
  });

  var initialActiveLangId = $('.language.active').attr('id');
  if (initialActiveLangId) {
    $('.switch-language[data-lang="' + initialActiveLangId + '"]').addClass('active-lang-link');
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
          $label.addClass('expanded');
        } else {
          $label.removeClass('expanded');
        }
      }
    });
  }

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
        } else {
          console.warn("No .project-page elements found in " + pageFilename + ".html. Pagination will not be applied.");
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

  window.kb_source_2_datenschutz = function() {
    loadContent('datenschutz', 'datenschutz');
    document.getElementById('datenschutz-p').style.display='block';
    document.getElementById('fade').style.display='block';
  };

  window.kb_source_2_impressum = function() {
    loadContent('impressum', 'impressum');
    document.getElementById('impressum-p').style.display='block';
    document.getElementById('fade').style.display='block';
  };

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
});
