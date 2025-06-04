// Global helper function to load content via AJAX
function loadContent(pageFilename, targetElementId, callback) {
  // Add a cache-busting timestamp to the URL to force reload
  var cacheBuster = "?_t=" + new Date().getTime(); 
  $.get('/pages/' + pageFilename + '.html' + cacheBuster) // <<< --- GEÄNDERTE ZEILE HIER
    .done(function(data) {
      $('#' + targetElementId).html(data);
      if (typeof callback === 'function') {
        callback(); // Call callback after content is loaded
      }
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
      console.error("Failed to load content for: " + pageFilename, textStatus, errorThrown);
      $('#' + targetElementId).html('<p>Error loading content. Please try again later.</p>');
      if (typeof callback === 'function') {
        callback(); // Call callback even on error
      }
    });
}

$(function() { // Equivalent to $(document).ready()

  // Preloader
  $(window).on('load', function() {
    $('#status').fadeOut();
    $('#preloader').delay(350).fadeOut('slow');
    $('body').delay(550).css({'overflow':'visible'});
  });

  // Language switcher
  $(".switch-language").on("click", function() {
    var switchTo = $(this).attr("id"); // e.g., 'german' or 'english'

    // Remove 'active' from all language parent divs
    $(".language").removeClass('active');
    // Set 'active' on the selected language parent div
    $(".language#" + switchTo).addClass('active');

    // Remove 'active-lang-link' from ALL language switch links
    $(".switch-language").removeClass('active-lang-link');

    // Add 'active-lang-link' to the clicked language link (both header and lightbox)
    $('.switch-language#' + switchTo).addClass('active-lang-link');
  });

  // Set initial active language link on page load
  // Find the active language div based on the HTML initially set
  var initialActiveLangId = $('.language.active').attr('id');
  if (initialActiveLangId) {
      $('.switch-language#' + initialActiveLangId).addClass('active-lang-link');
  }


  // Lightbox Hider on any click outside
  $('#fade').on('click', function(event) {
    $(".white_content, #fade").hide();
  });

  // --- START: Accordion Plus/Minus Label Updater Function ---
  function updateAccordionLabels() {
    $('input[type="radio"][name="rdo"]').each(function() {
      var radioId = $(this).attr('id');
      var $label = $('label.cat[for="' + radioId + '"]');
      if ($label.length) {
        if ($(this).is(':checked')) {
          $label.addClass('expanded');
          // Removed: $label.addClass('active-cat-label'); - Main categories only highlight on hover
        } else {
          $label.removeClass('expanded');
          // Removed: $label.removeClass('active-cat-label');
        }
      }
    });
  }
  // --- ENDE: Accordion Plus/Minus Label Updater Function ---

  // Radio Button Closer: Only for accordion radio buttons (name="rdo")
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

    // Update accordion label state immediately after change
    updateAccordionLabels();
  });

  // Call the function once on page load to set the initial state correctly
  updateAccordionLabels();

  // Function to generate pagination
  function generatePagination($contentContainer, totalPages, currentPageIndex) {
      // Remove any existing pagination controls first
      $contentContainer.find('.pagination-controls').remove();

      let paginationHtml = '<div class="pagination-controls">';
      for (let i = 0; i < totalPages; i++) {
          paginationHtml += `<a href="#" class="page-link ${i === currentPageIndex ? 'active' : ''}" data-page-index="${i}">${i + 1}</a>`;
      }
      paginationHtml += '</div>';
      $contentContainer.append(paginationHtml); // Appends pagination at the end of accordion content
  }

  // Accordion for subcategories (Vita, Büroprofil, Leistungen, Schwerpunkte, Projekte)
  $('.accordion-sub-toggle').on('click', function(event) {
    event.preventDefault(); // Prevent default link behavior

    var $this = $(this);
    var pageFilename = $this.data('page');
    var targetElementId = $this.data('target-id');
    var $targetContent = $('#' + targetElementId);
    var $arrowIcon = $this.find('.arrow');
    var $parentCatLink = $this.closest('.cat-link'); // The parent div with the .cat-link class


    // Close all other open accordion sub-contents and reset their highlights/arrows
    // Temporarily set overflow-y to hidden for all closing accordions to prevent flickers
    $('.accordion-content.active').not($targetContent).css('max-height', '0px').removeClass('active').html('').css('overflow-y', 'hidden');
    $('.accordion-sub-toggle .arrow.expanded').not($arrowIcon).removeClass('expanded');
    $('.cat-link.active-sub-link').not($parentCatLink).removeClass('active-sub-link'); // Remove highlight from all other links


    if ($targetContent.hasClass('active')) {
      // If currently active, close it
      $targetContent.css('max-height', '0px').removeClass('active').html('').css('overflow-y', 'hidden');
      $arrowIcon.removeClass('expanded');
      $parentCatLink.removeClass('active-sub-link'); // Remove highlight
    } else {
      // If not active, open it and load content
      loadContent(pageFilename, targetElementId, function() {
          // Callback function executes after content is loaded

          // --- Pagination logic for Projects (pageFilename === 'projekte') ---
          // NOTE: This now also applies to 'bauenimbestand.html' if it contains '.project-page' divs,
          // which was the user's explicit request.
          if (pageFilename === 'projekte' || pageFilename === 'bauenimbestand') { // Added 'bauenimbestand' here
              const $projectPages = $targetContent.find('.project-page');
              if ($projectPages.length > 0) {
                  // Hide all project pages
                  $projectPages.hide();
                  // Display the first page
                  $projectPages.first().show();

                  // Generate pagination
                  generatePagination($targetContent, $projectPages.length, 0); // 0 is the index of the first page

                  // Event Listener for pagination buttons
                  // Using .off().on() to prevent multiple bindings if accordion is opened multiple times
                  $targetContent.off('click', '.pagination-controls .page-link').on('click', '.pagination-controls .page-link', function(e) {
                      e.preventDefault();
                      const pageIndex = $(this).data('page-index');

                      // Hide all pages
                      $projectPages.hide();
                      // Show the clicked page
                      $projectPages.eq(pageIndex).show();

                      // Highlight active pagination button
                      $('.pagination-controls .page-link').removeClass('active');
                      $(this).addClass('active');

                      // Adjust max-height for the new content
                      // Crucial: Must be done after displaying the page, as scrollHeight is otherwise incorrect
                      const currentPageElement = $projectPages.eq(pageIndex)[0]; // Get native DOM element for scrollHeight
                      const currentProjectPageHeight = currentPageElement ? currentPageElement.scrollHeight : 0;
                      const paginationHeight = $targetContent.find('.pagination-controls').outerHeight(true) || 0; // Height of pagination controls

                      // Apply max-height and re-enable overflow-y after a brief delay for smooth transition
                      $targetContent.css('max-height', (currentProjectPageHeight + paginationHeight + 20) + 'px'); // +20px buffer
                      setTimeout(function() {
                          $targetContent.css('overflow-y', 'auto');
                      }, 500); // Matches CSS transition duration
                  });
              } else {
                 // If no .project-page found, treat as single page content for height calculation
                 console.warn("No .project-page elements found in " + pageFilename + ".html. Pagination will not be applied.");
              }
          }
          // --- END OF Pagination Logic ---

          // --- Standard accordion height adjustment (also applies to pagination if no .project-page found) ---
          $targetContent.addClass('active'); // Add 'active' class to enable padding
          $targetContent.outerHeight(); // Force reflow/repaint to get correct scrollHeight immediately

          const contentHeight = $targetContent.prop('scrollHeight');
          $targetContent.css('max-height', contentHeight + 'px');

          setTimeout(function() {
              $targetContent.css('overflow-y', 'auto');
          }, 500); // Matches CSS transition duration
      });
      $arrowIcon.addClass('expanded');
      $parentCatLink.addClass('active-sub-link'); // Add highlight
    }
  });


  // Lightbox functions (Impressum, Datenschutz) - these remain as lightboxes
  window.kb_source_2_datenschutz = function() { loadContent('datenschutz', 'datenschutz'); document.getElementById('datenschutz-p').style.display='block';document.getElementById('fade').style.display='block'; };
  window.kb_source_2_impressum = function() { loadContent('impressum', 'impressum'); document.getElementById('impressum-p').style.display='block';document.getElementById('fade').style.display='block'; };

  // Dark Mode Logic
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

}); // End of $(function() { ... })
