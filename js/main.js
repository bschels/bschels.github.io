(() => {
  "use strict";
  const accordionState = new Map();

  function loadPage(page, targetId, cb) {
    const cacheBust = "?_t=" + Date.now();
    const panelId = targetId + "-p";
    const target = document.getElementById(targetId);
    
    fetch(`/pages/${page}.html${cacheBust}`)
      .then((res) => (res.ok ? res.text() : Promise.reject()))
      .then((html) => {
        // Nutze extractContentFromHTML für konsistente Verarbeitung
        if (!extractContentFromHTML(html, targetId)) {
          // Fallback falls extractContentFromHTML fehlschlägt
          if (target) target.innerHTML = html;
        }
        // Scroll auf oben setzen nach dem Laden
        setTimeout(() => scrollLightboxToTop(panelId), 10);
        cb && cb();
      })
      .catch(() => {
        if (target) {
          target.innerHTML = "<p>Fehler beim Laden. Bitte versuchen Sie es erneut.</p>";
        }
        // Scroll auf oben setzen auch bei Fehler
        setTimeout(() => scrollLightboxToTop(panelId), 10);
        cb && cb();
      });
  }

  function fadeOut(el, duration, cb) {
    el.style.transition = "opacity " + duration + "ms";
    el.style.opacity = "0";
    setTimeout(() => {
      el.style.display = "none";
      el.style.opacity = "";
      el.style.transition = "";
      cb && cb();
    }, duration);
  }

  function fadeIn(el, duration) {
    el.style.opacity = "0";
    el.style.display = "block";
    el.style.transition = "opacity " + duration + "ms";
    setTimeout(() => (el.style.opacity = "1"), 10);
    setTimeout(() => {
      el.style.transition = "";
    }, duration);
  }

  // Optimiert: Nutzt gecachte Elemente wenn verfügbar
  function updateAccordionAria() {
    const inputs = window._cachedAccordionInputs || document.querySelectorAll('input[type="radio"][name="rdo"]');
    inputs.forEach((input) => {
      const label = document.querySelector(`label.cat[for="${input.id}"]`);
      if (!label) return;
      const isChecked = input.checked;
      label.classList.toggle("expanded", isChecked);
      label.setAttribute("aria-expanded", isChecked ? "true" : "false");
    });
  }

  window.kb_source_2_datenschutz = function () {
    loadPage("datenschutz", "datenschutz", () => {
      setTimeout(() => scrollLightboxToTop("datenschutz-p"), 10);
    });
    openLightbox("datenschutz-p");
  };

  window.kb_source_2_impressum = function () {
    loadPage("impressum", "impressum", () => {
      setTimeout(() => scrollLightboxToTop("impressum-p"), 10);
    });
    openLightbox("impressum-p");
  };

  window.kb_source_2_vita = function () {
    // Öffne die Vita-Lightbox direkt (closeAllLightboxes wird in openLightbox nicht benötigt)
    openLightbox("vita-p");
  };

  // Hilfsfunktion: Schließe alle offenen Lightboxes außer der angegebenen (optimiert)
  function closeAllLightboxesExcept(exceptId) {
    const whiteContentPanels = window._cachedWhiteContent || document.querySelectorAll('.white_content');
    whiteContentPanels.forEach(panel => {
      if (panel.id !== exceptId && panel.style.display === "block") {
        panel.style.display = "none";
      }
    });
  }

  // Zentrale Funktion: Schließe ALLE Lightboxes (robust und sicher, optimiert)
  function closeAllLightboxes() {
    // WICHTIG: Immer alle Lightboxes neu suchen, auch dynamisch erstellte
    const whiteContentPanels = document.querySelectorAll('.white_content');
    const fade = document.getElementById("fade");
    
    // Alle Lightboxes schließen - FORCE close, keine Prüfung
    whiteContentPanels.forEach(panel => {
      panel.style.display = "none";
    });
    
    if (fade) {
      fade.style.display = "none";
    }
    document.body.style.overflow = "";
    
    // Cache aktualisieren
    if (window._cachedWhiteContent) {
      window._cachedWhiteContent = Array.from(whiteContentPanels);
    }
  }

  // Hilfsfunktion: Setze Scroll-Position einer Lightbox auf oben
  function scrollLightboxToTop(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    const lightboxContainer = panel.querySelector('.lightbox');
    if (lightboxContainer) {
      lightboxContainer.scrollTop = 0;
    }
  }

  // Hilfsfunktion: Öffne eine Lightbox (optimiert, reduziert Code-Duplikation)
  function openLightbox(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    const fade = document.getElementById("fade");
    if (!fade) return;
    panel.style.display = "block";
    fade.style.display = "block";
    document.body.style.overflow = "hidden";
    setTimeout(() => scrollLightboxToTop(panelId), 10);
  }

  // Hilfsfunktion: Prüfe ob auf Startseite (optimiert, reduziert Code-Duplikation)
  function isOnHomepage() {
    const path = window.location.pathname;
    return path === '/' || path === '/index.html' || path === '';
  }

  // Hilfsfunktion: Extrahiere Content aus HTML (reduziert Code-Duplikation, optimiert)
  function extractContentFromHTML(html, targetId) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const target = document.getElementById(targetId);
    if (!target) return false;
    
    const content = doc.querySelector('.cat_text');
    if (content) {
      content.querySelectorAll('header, footer, nav').forEach(el => el.remove());
      target.innerHTML = content.innerHTML;
      return true;
    }
    
    const main = doc.querySelector('main');
    if (main) {
      main.querySelectorAll('header, footer, nav').forEach(el => el.remove());
      target.innerHTML = main.innerHTML;
      return true;
    }
    
    target.innerHTML = html;
    return false;
  }

  window.kb_source_2_hoai = function () {
    // Schließe alle anderen Lightboxes zuerst
    closeAllLightboxesExcept("hoai-p");

    // Lade die HOAI-Seite aus /artikel/ statt /pages/
    const cacheBust = "?_t=" + Date.now();
    fetch(`/artikel/hoai.html${cacheBust}`)
      .then((res) => (res.ok ? res.text() : Promise.reject()))
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Erstelle Breadcrumbs
        const breadcrumbContainer = document.querySelector('#hoai-p .lb_breadcrumb');
        if (breadcrumbContainer) {
          breadcrumbContainer.innerHTML = `
            <nav class="breadcrumb breadcrumb-lightbox" aria-label="Breadcrumb">
              <ol>
                <li><a href="/artikel/" data-open-artikel="">Artikel</a></li>
                <li><a href="/artikel/grundlagen.html" data-open-category="/artikel/grundlagen.html">Grundlagen</a></li>
                <li aria-current="page">HOAI</li>
              </ol>
            </nav>
          `;
          // Stelle sicher, dass der Artikel-Link einen Event-Listener hat (sofort, nicht in setTimeout)
          const artikelLinkInBreadcrumb = breadcrumbContainer.querySelector('a[data-open-artikel]');
          if (artikelLinkInBreadcrumb) {
            artikelLinkInBreadcrumb.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              closeAllLightboxes();
              setTimeout(() => {
                kb_source_2_artikel();
              }, 10);
            }, true);
          }
        }
        
        extractContentFromHTML(html, "hoai");
        openLightbox("hoai-p");
      })
      .catch(() => {
        const hoaiEl = document.getElementById("hoai");
        if (hoaiEl) {
          hoaiEl.innerHTML = "<p>Fehler beim Laden. Bitte versuchen Sie es später erneut.</p>";
        }
        openLightbox("hoai-p");
      });
  };

  window.kb_source_2_artikel = function () {
    // WICHTIG: Schließe ALLE Lightboxes zuerst, dann öffne die Artikel-Lightbox
    // Das verhindert, dass mehrere Lightboxes übereinander liegen
    closeAllLightboxes();
    
    // Kurze Verzögerung, um sicherzustellen, dass alle Lightboxes geschlossen sind
    // (besonders wichtig für dynamisch erstellte Lightboxes)
    setTimeout(() => {

    // Lade die Artikel-Übersichtsseite
    const cacheBust = "?_t=" + Date.now();
    fetch(`/artikel/index.html${cacheBust}`)
      .then((res) => (res.ok ? res.text() : Promise.reject()))
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        extractContentFromHTML(html, "artikel");
        
        // WICHTIG: Stelle sicher, dass alle anderen Lightboxes geschlossen sind, bevor wir öffnen
        closeAllLightboxes();
        openLightbox("artikel-p");
        
        // Event-Listener für Anker-Links im Modal hinzufügen
        const artikelContainer = document.getElementById("artikel");
        if (artikelContainer) {
          artikelContainer.addEventListener("click", function(event) {
            const link = event.target.closest('a[href^="#"]');
            if (link && link.getAttribute("href") !== "#") {
              const href = link.getAttribute("href");
              const targetId = href.substring(1);
              const targetElement = artikelContainer.querySelector(`#${targetId}`);
              if (targetElement) {
                event.preventDefault();
                event.stopPropagation();
                // Scroll innerhalb des lightbox-Containers (der scrollbare Container)
                const targetRect = targetElement.getBoundingClientRect();
                const containerRect = artikelContainer.getBoundingClientRect();
                const scrollTop = artikelContainer.scrollTop;
                const targetTop = targetRect.top - containerRect.top + scrollTop - 20;
                artikelContainer.scrollTo({ top: targetTop, behavior: "smooth" });
              }
            }
          }, true);
        }
        
        // Event-Delegation für Breadcrumb-Links direkt auf dem document
        // Wird bereits vom globalen Event-Listener in Zeile 863 abgefangen, aber sicherstellen dass es funktioniert
        setTimeout(() => {
          const breadcrumbLinks = document.querySelectorAll('.lb_breadcrumb a[data-open-artikel], .lb_breadcrumb a[href="/artikel/"]');
          breadcrumbLinks.forEach(link => {
            // Stelle sicher, dass das data-open-artikel Attribut vorhanden ist
            if (!link.hasAttribute('data-open-artikel') && (link.getAttribute('href') === '/artikel/' || link.getAttribute('href') === '/artikel/index.html')) {
              link.setAttribute('data-open-artikel', '');
            }
          });
        }, 100);
      })
      .catch(() => {
        const artikelEl = document.getElementById("artikel");
        if (artikelEl) {
          artikelEl.innerHTML = "<p>Fehler beim Laden. Bitte versuchen Sie es später erneut.</p>";
        }
        // WICHTIG: Stelle sicher, dass alle anderen Lightboxes geschlossen sind
        closeAllLightboxes();
        openLightbox("artikel-p");
      });
    }, 0); // setTimeout schließen
  };

  window.kb_source_2_baugenehmigung = function () {
    // Schließe alle anderen Lightboxes zuerst
    closeAllLightboxesExcept("baugenehmigung-p");

    const cacheBust = "?_t=" + Date.now();
    fetch(`/artikel/baugenehmigung.html${cacheBust}`)
      .then((res) => (res.ok ? res.text() : Promise.reject()))
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Erstelle Breadcrumbs
        const breadcrumbContainer = document.querySelector('#baugenehmigung-p .lb_breadcrumb');
        if (breadcrumbContainer) {
          breadcrumbContainer.innerHTML = `
            <nav class="breadcrumb breadcrumb-lightbox" aria-label="Breadcrumb">
              <ol>
                <li><a href="/artikel/" data-open-artikel="">Artikel</a></li>
                <li><a href="/artikel/recht-genehmigung.html" data-open-category="/artikel/recht-genehmigung.html">Recht & Genehmigung</a></li>
                <li aria-current="page">Baugenehmigung</li>
              </ol>
            </nav>
          `;
          // Stelle sicher, dass der Artikel-Link einen Event-Listener hat (sofort, nicht in setTimeout)
          const artikelLinkInBreadcrumb = breadcrumbContainer.querySelector('a[data-open-artikel]');
          if (artikelLinkInBreadcrumb) {
            artikelLinkInBreadcrumb.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              closeAllLightboxes();
              setTimeout(() => {
                kb_source_2_artikel();
              }, 10);
            }, true);
          }
        }
        
        extractContentFromHTML(html, "baugenehmigung");
        openLightbox("baugenehmigung-p");
      })
      .catch(() => {
        const baugenehmigungEl = document.getElementById("baugenehmigung");
        if (baugenehmigungEl) {
          baugenehmigungEl.innerHTML = "<p>Fehler beim Laden. Bitte versuchen Sie es erneut.</p>";
        }
        openLightbox("baugenehmigung-p");
      });
  };

  window.kb_source_2_kostenbasis = function () {
    // Schließe alle anderen Lightboxes zuerst
    closeAllLightboxesExcept("kostenbasis-p");

    const cacheBust = "?_t=" + Date.now();
    fetch(`/artikel/kostenbasis-architektur.html${cacheBust}`)
      .then((res) => (res.ok ? res.text() : Promise.reject()))
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Erstelle Breadcrumbs
        const breadcrumbContainer = document.querySelector('#kostenbasis-p .lb_breadcrumb');
        if (breadcrumbContainer) {
          breadcrumbContainer.innerHTML = `
            <nav class="breadcrumb breadcrumb-lightbox" aria-label="Breadcrumb">
              <ol>
                <li><a href="/artikel/" data-open-artikel="">Artikel</a></li>
                <li><a href="/artikel/kosten-honorare.html" data-open-category="/artikel/kosten-honorare.html">Kosten & Honorare</a></li>
                <li aria-current="page">Kostenbasis</li>
              </ol>
            </nav>
          `;
          // Stelle sicher, dass der Artikel-Link einen Event-Listener hat (sofort, nicht in setTimeout)
          const artikelLinkInBreadcrumb = breadcrumbContainer.querySelector('a[data-open-artikel]');
          if (artikelLinkInBreadcrumb) {
            artikelLinkInBreadcrumb.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              closeAllLightboxes();
              setTimeout(() => {
                kb_source_2_artikel();
              }, 10);
            }, true);
          }
        }
        
        extractContentFromHTML(html, "kostenbasis");
        openLightbox("kostenbasis-p");
      })
      .catch(() => {
        const kostenbasisEl = document.getElementById("kostenbasis");
        if (kostenbasisEl) {
          kostenbasisEl.innerHTML = "<p>Fehler beim Laden. Bitte versuchen Sie es erneut.</p>";
        }
        openLightbox("kostenbasis-p");
      });
  };

  window.openProjektbild = function (imgSrc) {
    const img = document.getElementById("projektbild-gross");
    if (img) {
      img.src = imgSrc;
      img.alt = "Projektbild";
    }
    openLightbox("projektbild-p");
  };

  // WICHTIG: Lightbox-Event-Listener SOFORT registrieren (mit CAPTURE Phase)
  // Läuft VOR allen anderen Event-Listenern
  document.addEventListener("click", function (event) {
    // WICHTIG: Vita-Link MUSS ZUERST geprüft werden (vor allen anderen), da er innerhalb eines Accordions ist
    const vitaLink = event.target.closest("[data-open-vita]");
    if (vitaLink) {
      event.preventDefault();
      event.stopPropagation();
      kb_source_2_vita();
      return false;
    }

    // WICHTIG: Lightbox öffnen - Artikel MUSS ZUERST geprüft werden, bevor andere Handler
    // Prüfe sowohl auf data-open-artikel Attribut als auch auf href="/artikel/"
    // WICHTIG: Muss auch in Lightboxes funktionieren (Breadcrumb-Links, auch in Kategorie-Seiten)
    let artikelLink = null;
    
    // Prüfe zuerst auf data-open-artikel (funktioniert auch bei dynamisch erstellten Links)
    if (event.target && event.target.closest) {
      artikelLink = event.target.closest("[data-open-artikel]");
    }
    
    // Zusätzliche Prüfung: Wenn das geklickte Element selbst ein Link mit data-open-artikel ist
    if (!artikelLink && event.target && event.target.tagName === 'A' && event.target.hasAttribute && event.target.hasAttribute("data-open-artikel")) {
      artikelLink = event.target;
    }
    
    // Fallback: Prüfe auf href="/artikel/" (aber nicht data-open-category)
    if (!artikelLink && event.target && event.target.closest) {
      const link = event.target.closest('a[href="/artikel/"], a[href="/artikel/index.html"]');
      if (link && link.hasAttribute && !link.hasAttribute("data-open-category")) {
        artikelLink = link;
      }
    }
    
    if (artikelLink) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      // Stelle sicher, dass alle anderen Lightboxes geschlossen sind
      closeAllLightboxes();
      // Kurze Verzögerung, um sicherzustellen, dass alle Lightboxes geschlossen sind
      setTimeout(() => {
        kb_source_2_artikel();
      }, 10);
      return false;
    }

    // Lightbox schließen
    const closeBtn = event.target.closest("[data-close-lightbox]");
    if (closeBtn) {
      event.preventDefault();
      event.stopPropagation();
      const id = closeBtn.dataset.closeLightbox;
      const panel = document.getElementById(id);
      if (panel) {
        panel.style.display = "none";
        const fade = document.getElementById("fade");
        if (fade) fade.style.display = "none";
        document.body.style.overflow = "";
      }
      return;
    }

    // Lightbox schließen beim Klick auf den dunklen Hintergrund
    const fade = document.getElementById("fade");
    if (event.target === fade) {
      closeAllLightboxes();
      return;
    }

    // Lightbox öffnen - Impressum
    const impressumLink = event.target.closest("[data-open-impressum]");
    if (impressumLink) {
      event.preventDefault();
      event.stopPropagation();
      kb_source_2_impressum();
      return false;
    }

    // Lightbox öffnen - Datenschutz
    const datenschutzLink = event.target.closest("[data-open-datenschutz]");
    if (datenschutzLink) {
      event.preventDefault();
      event.stopPropagation();
      kb_source_2_datenschutz();
      return false;
    }

    // Lightbox öffnen - HOAI
    const hoaiLink = event.target.closest("[data-open-hoai]");
    if (hoaiLink) {
      event.preventDefault();
      event.stopPropagation();
      kb_source_2_hoai();
      return false;
    }

    // Lightbox öffnen - Kategorie
    const categoryLink = event.target.closest("[data-open-category]");
    if (categoryLink) {
      event.preventDefault();
      event.stopPropagation();
      const categoryUrl = categoryLink.getAttribute("data-open-category");
      if (categoryUrl) {
        const categoryName = categoryUrl.split('/').pop().replace('.html', '');
        const lightboxId = "artikel-" + categoryName;
        if (!document.getElementById(lightboxId + "-p")) {
          const lightboxDiv = document.createElement("div");
          lightboxDiv.id = lightboxId + "-p";
          lightboxDiv.className = "white_content";
          lightboxDiv.innerHTML = `
            <div class="lb_header">
              <div class="lb_breadcrumb"></div>
              <div class="lb_close">
                <a href="#" data-close-lightbox="${lightboxId}-p" class="white" aria-label="Schließen">×</a>
              </div>
            </div>
            <div class="lb_footer"></div>
            <div class="lightbox" id="${lightboxId}"></div>
          `;
          document.body.appendChild(lightboxDiv);
        }
        loadArticleLightbox(categoryUrl, lightboxId);
        return;
      }
    }

    // Lightbox öffnen - Projektbild
    const projektbildTrigger = event.target.closest("[data-open-projektbild]");
    if (projektbildTrigger) {
      event.preventDefault();
      event.stopPropagation();
      const imgSrc = projektbildTrigger.getAttribute("data-open-projektbild");
      if (imgSrc) {
        openProjektbild(imgSrc);
      }
      return;
    }
  }, true); // CAPTURE PHASE - läuft VOR allen anderen Event-Listenern

  document.addEventListener("DOMContentLoaded", function () {
    // Cache häufig verwendete Elemente (einmalig, für bessere Performance)
    const fade = document.getElementById("fade");
    const allAccordionInputs = document.querySelectorAll('input[type="radio"][name="rdo"]');
    const allAccordionLabels = document.querySelectorAll('label.cat[for^="tog"]');
    const allWhiteContent = document.querySelectorAll(".white_content");
    
    // Cache Elemente global für bessere Performance
    window._cachedFade = fade;
    window._cachedWhiteContent = allWhiteContent;
    window._cachedAccordionInputs = allAccordionInputs;

    // Helper-Funktionen für bessere Performance
    const getScrollY = () => window.pageYOffset || window.scrollY;
    const getLabelForInput = (inputId) => document.querySelector(`label[for="${inputId}"]`);
    const getLabelCatForInput = (inputId) => document.querySelector(`label.cat[for="${inputId}"]`);

    // ZENTRALE Funktion: Synchronisiert ALLE HR-Elemente basierend auf dem aktuellen Zustand (optimiert)
    function syncAllHrElements() {
      allAccordionInputs.forEach((input) => {
        const label = getLabelForInput(input.id);
        if (!label) return;
        const hrInLabel = label.querySelector("hr.z");
        if (hrInLabel) {
          // HR verstecken wenn Accordion offen, anzeigen wenn geschlossen
          hrInLabel.style.display = input.checked ? "none" : "block";
        }
      });
    }

    // Accordion-State initialisieren
    allAccordionInputs.forEach((input) => {
      accordionState.set(input.id, input.checked);
    });

    function isMobile() {
      return window.matchMedia && window.matchMedia("(max-width: 810px)").matches;
    }

    // Lightbox-Overlay schließen
    if (fade) {
      fade.addEventListener("click", function () {
        allWhiteContent.forEach((el) => (el.style.display = "none"));
        fade.style.display = "none";
      });
    }

    // Optimierte Scroll-Funktion: Reduziert Springen durch besseres Timing
    let activeScrollLock = null;

    function scrollToAccordionContent(input) {
      if (!input) return;

      // WICHTIG: Zum label.cat scrollen (der Titel), NICHT irgendein Label
      const label = getLabelCatForInput(input.id);
      if (!label) return;

      // IMMER vorherige Scroll-Locks aufräumen
      if (activeScrollLock) {
        clearInterval(activeScrollLock.interval);
        activeScrollLock = null;
      }

      // Position des Labels berechnen
      const rect = label.getBoundingClientRect();
      const currentScrollY = getScrollY();
      const targetY = currentScrollY + rect.top;

      // Während der CSS-Animation die Position aggressiv halten
      let lastTargetY = targetY;
      const holdPosition = () => {
        // Position immer wieder setzen (verhindert Browser-Auto-Scroll)
        window.scrollTo({ top: lastTargetY, behavior: "instant" });

        // Position neu berechnen falls sich Layout ändert
        const newRect = label.getBoundingClientRect();
        const newTargetY = getScrollY() + newRect.top;
        if (Math.abs(newTargetY - lastTargetY) > 10) {
          lastTargetY = newTargetY;
        }
      };

      const interval = setInterval(holdPosition, 8); // 120fps für bessere Fixierung

      // Nach Animation: Finale Position setzen und aufräumen
      setTimeout(() => {
        clearInterval(interval);
        const finalRect = label.getBoundingClientRect();
        const finalY = getScrollY() + finalRect.top;
        window.scrollTo({ top: finalY, behavior: "instant" });
        activeScrollLock = null;
      }, 550);

      activeScrollLock = { interval };
    }

    // Change-Handler: Nur für programmatische Änderungen (z.B. interne Links)
    // Scrollt NICHT, da der Click-Handler das übernimmt
    allAccordionInputs.forEach((input) => {
      input.addEventListener("change", function () {
        accordionState.set(this.id, this.checked);
        syncAllHrElements();
        updateAccordionAria();
      });
    });

    // Toggle-Verhalten: KOMPLETT manuell steuern, um Browser-Scroll zu verhindern
    // Event-Delegation für bessere Performance
    document.addEventListener("click", function (event) {
      const label = event.target.closest('label.cat[for^="tog"]');
      if (!label) return;

      const id = label.getAttribute("for");
      const input = id ? document.getElementById(id) : null;
      if (!input) return;

      // IMMER native Verhalten verhindern (verhindert Browser-Auto-Scroll!)
      event.preventDefault();
      event.stopPropagation();

      if (input.checked) {
        // Schließen
        input.checked = false;
        syncAllHrElements();
        updateAccordionAria();
      } else {
        // Öffnen: Scroll während Animation komplett sperren
        const targetLabel = getLabelCatForInput(input.id);
        let lockedScrollY = getScrollY();

        // Scroll-Lock aktivieren
        const lockScroll = () => {
          if (Math.abs(getScrollY() - lockedScrollY) > 1) {
            window.scrollTo({ top: lockedScrollY, behavior: "instant" });
          }
        };
        const lockInterval = setInterval(lockScroll, 8);

        // Erst andere schließen
        allAccordionInputs.forEach((other) => {
          if (other !== input && other.checked) {
            other.checked = false;
          }
        });
        input.checked = true;
        syncAllHrElements();
        updateAccordionAria();

        // Nach Animation: Lock entfernen und zum Ziel scrollen
        setTimeout(() => {
          clearInterval(lockInterval);
          scrollToAccordionContent(input);
        }, 550);
      }
    });

    // Keyboard-Navigation für Accordions
    document.addEventListener("keydown", function (event) {
      const label = event.target.closest('label.cat[for^="tog"]');
      if (!label) return;

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        label.click();
      }
    });


    // Initial: ALLE HR-Elemente synchronisieren
    syncAllHrElements();

    updateAccordionAria();

    // Hash beim Laden der Seite verarbeiten (z.B. von /#kontakt)
    function handleInitialHash() {
      const hash = window.location.hash.substring(1);
      if (!hash) return;
      
      const idMap = {
        "profil": "tog1",
        "leistungen": "tog3",
        "projekte": "tog4",
        "kontakt": "tog5"
      };
      
      const accordionId = idMap[hash] || hash;
      const input = document.getElementById(accordionId);
      const section = document.getElementById(hash);
      
      if (input) {
        // Alle anderen Accordions schließen
        allAccordionInputs.forEach((other) => {
          if (other !== input && other.checked) {
            other.checked = false;
          }
        });
        
        // Accordion öffnen
        input.checked = true;
        syncAllHrElements();
        updateAccordionAria();
        
        // Hash aus URL entfernen nach dem Öffnen (besonders für Kontakt)
        if (hash === "kontakt") {
          history.replaceState(null, '', window.location.pathname + window.location.search);
        }
        
        // IMMER zum Accordion-Titel scrollen (auch bei Kontakt)
        setTimeout(() => {
          scrollToAccordionContent(input);
        }, 100);
      } else if (section && !input) {
        // Fallback: Direkt zur Section scrollen
        setTimeout(() => {
          const y = section.getBoundingClientRect().top + getScrollY() - 20;
          window.scrollTo({ top: y, behavior: "smooth" });
        }, 100);
      }
    }
    
    // Hash beim Laden verarbeiten
    if (window.location.hash) {
      setTimeout(handleInitialHash, 150);
      window.addEventListener("load", function() {
        setTimeout(handleInitialHash, 100);
      }, { once: true });
    }
    
    // Hash-Änderungen verarbeiten (z.B. wenn man von einer anderen Seite kommt)
    window.addEventListener("hashchange", function() {
      setTimeout(handleInitialHash, 100);
    });

    // Generische Funktion zum Laden von Artikel-Lightboxes
    window.loadArticleLightbox = function(articlePath, lightboxId) {
      // Schließe alle anderen Lightboxes zuerst
      closeAllLightboxesExcept(lightboxId + "-p");

      const cacheBust = "?_t=" + Date.now();
      fetch(`${articlePath}${cacheBust}`)
        .then((res) => (res.ok ? res.text() : Promise.reject()))
        .then((html) => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          
          // Mapping: Dateiname → Kategorie
          const fileName = articlePath.split('/').pop().replace('.html', '');
          const categoryMap = {
            'hoai': 'Grundlagen',
            'leistungsphasen': 'Grundlagen',
            'planung-architektur': 'Grundlagen',
            'haus-bauen-architekt': 'Grundlagen',
            'neubau': 'Neubau',
            'bauweisen-neubau': 'Neubau',
            'holzbau': 'Neubau',
            'umbau-architektur': 'Bauen im Bestand',
            'sanierung-architektur': 'Bauen im Bestand',
            'denkmal-architektur': 'Bauen im Bestand',
            'baugenehmigung': 'Recht & Genehmigung',
            'genehmigungsplanung': 'Recht & Genehmigung',
            'genehmigungsfrei': 'Recht & Genehmigung',
            'gebaeudeklassen': 'Recht & Genehmigung',
            'flaechen-begriffe': 'Recht & Genehmigung',
            'bestandsschutz': 'Recht & Genehmigung',
            'architektur-pfaffenhofen': 'Recht & Genehmigung',
            'architektur-wolnzach': 'Recht & Genehmigung',
            'ausfuehrungsplanung-architektur': 'Planung & Ausführung',
            'bauleitung-architektur': 'Planung & Ausführung',
            'fachplaner': 'Planung & Ausführung',
            'kostenbasis-architektur': 'Kosten & Honorare',
            'architekt-kosten': 'Kosten & Honorare'
          };
          
          // Prüfe ob es eine Kategorie-Seite ist
          const isCategoryPage = ['grundlagen', 'neubau-kategorie', 'bauen-im-bestand', 'recht-genehmigung', 'planung-ausfuehrung', 'kosten-honorare'].includes(fileName);
          
          const category = categoryMap[fileName] || (isCategoryPage ? null : 'Artikel');
          
          // Extrahiere Titel für Breadcrumbs
          const h1 = doc.querySelector('h1');
          let pageTitle = '';
          if (h1) {
            pageTitle = h1.textContent.trim();
            // Für Artikel: Kürze auf ersten Teil vor "–"
            if (!isCategoryPage) {
              const parts = pageTitle.split('–');
              if (parts.length > 1) {
                pageTitle = parts[0].trim();
              } else {
                pageTitle = pageTitle.substring(0, 30).trim();
              }
            }
          } else {
            pageTitle = fileName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          }
          
          // Erstelle Breadcrumbs
          const breadcrumbContainer = document.querySelector(`#${lightboxId}-p .lb_breadcrumb`);
          if (breadcrumbContainer) {
            // Mapping: Kategorie → URL
            const categoryUrlMap = {
              'Grundlagen': '/artikel/grundlagen.html',
              'Neubau': '/artikel/neubau-kategorie.html',
              'Bauen im Bestand': '/artikel/bauen-im-bestand.html',
              'Recht & Genehmigung': '/artikel/recht-genehmigung.html',
              'Planung & Ausführung': '/artikel/planung-ausfuehrung.html',
              'Kosten & Honorare': '/artikel/kosten-honorare.html'
            };
            
            if (isCategoryPage) {
              // Kategorie-Seite: Artikel → [Kategorie]
              const categoryName = pageTitle;
              breadcrumbContainer.innerHTML = `
                <nav class="breadcrumb breadcrumb-lightbox" aria-label="Breadcrumb">
                  <ol>
                    <li><a href="/artikel/" data-open-artikel="">Artikel</a></li>
                    <li aria-current="page">${categoryName}</li>
                  </ol>
                </nav>
              `;
              // Stelle sicher, dass der Artikel-Link einen Event-Listener hat (sofort, nicht in setTimeout)
              const artikelLinkInBreadcrumb = breadcrumbContainer.querySelector('a[data-open-artikel]');
              if (artikelLinkInBreadcrumb) {
                artikelLinkInBreadcrumb.addEventListener('click', function(e) {
                  e.preventDefault();
                  e.stopPropagation();
                  e.stopImmediatePropagation();
                  closeAllLightboxes();
                  setTimeout(() => {
                    kb_source_2_artikel();
                  }, 10);
                }, true);
              }
            } else if (category && category !== 'Artikel') {
              // Artikel-Seite: Artikel → [Kategorie] → [Artikel]
              const categoryUrl = categoryUrlMap[category] || '/artikel/';
              breadcrumbContainer.innerHTML = `
                <nav class="breadcrumb breadcrumb-lightbox" aria-label="Breadcrumb">
                  <ol>
                    <li><a href="/artikel/" data-open-artikel="">Artikel</a></li>
                    <li><a href="${categoryUrl}" data-open-category="${categoryUrl}">${category}</a></li>
                    <li aria-current="page">${pageTitle}</li>
                  </ol>
                </nav>
              `;
              // Stelle sicher, dass der Artikel-Link einen Event-Listener hat (sofort, nicht in setTimeout)
              const artikelLinkInBreadcrumb = breadcrumbContainer.querySelector('a[data-open-artikel]');
              if (artikelLinkInBreadcrumb) {
                artikelLinkInBreadcrumb.addEventListener('click', function(e) {
                  e.preventDefault();
                  e.stopPropagation();
                  e.stopImmediatePropagation();
                  closeAllLightboxes();
                  setTimeout(() => {
                    kb_source_2_artikel();
                  }, 10);
                }, true);
              }
            }
          }
          
          extractContentFromHTML(html, lightboxId);
          openLightbox(lightboxId + "-p");
        })
        .catch(() => {
          const lightboxEl = document.getElementById(lightboxId);
          if (lightboxEl) {
            lightboxEl.innerHTML = "<p>Fehler beim Laden. Bitte versuchen Sie es später erneut.</p>";
          }
          openLightbox(lightboxId + "-p");
        });
    };


    // FRÜHER Event-Listener: Artikel-Links abfangen (auf Startseite UND in Lightboxes)
    // WICHTIG: Läuft in CAPTURE Phase, aber NUR für Artikel-Links, NICHT für andere Lightbox-Links
    document.addEventListener("click", function (event) {
      // WICHTIG: Prüfe ZUERST auf data-open-artikel (auch in Lightboxes/Breadcrumbs)
      // Das muss VOR der Blockier-Liste stehen, damit Breadcrumb-Links funktionieren
      const artikelLinkInBreadcrumb = event.target.closest("[data-open-artikel]");
      if (artikelLinkInBreadcrumb) {
        // Wird vom ERSTEN Event-Listener verarbeitet, aber als Fallback hier auch behandeln
        // (falls der erste Event-Listener aus irgendeinem Grund nicht greift)
        event.preventDefault();
        event.stopPropagation();
        closeAllLightboxes();
        kb_source_2_artikel();
        return false;
      }
      
      // WICHTIG: Überspringe andere Lightbox-Links
      // Muss GANZ AM ANFANG stehen, bevor andere Prüfungen
      // Prüfe zuerst auf data-*-Attribute, dann auf href
      const lightboxLink = event.target.closest("[data-open-impressum], [data-open-datenschutz], [data-open-vita], [data-open-hoai], [data-open-category], [data-open-projektbild], [data-close-lightbox]");
      if (lightboxLink) {
        return; // Wird vom Lightbox-Event-Listener oben verarbeitet - NICHT blockieren!
      }
      
      const isInLightbox = event.target.closest('.white_content, .lightbox');

      // Artikel-Links werden jetzt normal geöffnet (nicht mehr als Lightbox)
      // Keine Behandlung mehr für Artikel-Links - sie funktionieren als normale Links
    }, true); // capture phase - wird VOR anderen Handlern ausgeführt


    // Event-Listener für # Links - NUR für Accordion-Links auf der Startseite
    // WICHTIG: Läuft in BUBBLING PHASE NACH Lightbox-Event-Listenern
    document.addEventListener("click", function (event) {
      // Prüfe ob es ein Link zu einem Accordion ist
      const target = event.target.closest('a[href^="#"], a[href^="/#"]');
      if (!target) return;
      
      const href = target.getAttribute("href");
      if (!href || href === "#" || href === "/#") return;
      
      // Lightbox-Links überspringen (haben auch href="#")
      if (event.target.closest("[data-open-impressum], [data-open-datenschutz], [data-open-vita], [data-open-hoai], [data-open-artikel], [data-open-projektbild]")) {
        return; // Wird vom Lightbox-Handler verarbeitet
      }
      
      // "→ Kontakt aufnehmen" Links überspringen (werden vom speziellen Event-Listener verarbeitet)
      if (target.classList.contains('author-contact-link')) {
        return;
      }

      // Prüfe ob Link innerhalb einer Lightbox ist
      const isInLightbox = event.target.closest('.white_content, .lightbox');
      
      // Extrahiere Hash: "#kontakt" oder "/#kontakt" -> "kontakt"
      let id = href;
      if (id.startsWith("/#")) {
        id = id.substring(2);
      } else if (id.startsWith("#")) {
        id = id.substring(1);
      }
      
      // Mapping für SEO-freundliche IDs zu Accordion-IDs
      const idMap = {
        "profil": "tog1",
        "leistungen": "tog3",
        "projekte": "tog4",
        "kontakt": "tog5"
      };

      const accordionId = idMap[id];
      
      // NUR verarbeiten wenn es ein Accordion-Link ist
      if (!accordionId) {
        // Kein Accordion-Link -> ignorieren
        return;
      }
      
      const input = document.getElementById(accordionId);
      if (!input) return; // Accordion existiert nicht
      
      // Wenn Link zu Startseite führt (/), dann zur Startseite navigieren
      if (href.startsWith("/#")) {
        if (!isOnHomepage()) {
          // Nicht auf Startseite: Zur Startseite navigieren
          event.preventDefault();
          event.stopPropagation();
          closeAllLightboxes();
          window.location.href = href;
          return;
        }
        // Bereits auf Startseite: Weiter mit Accordion-Öffnung
      }
      
      // Wenn Link in einer Lightbox ist und NICHT zur Startseite führt, ignorieren
      if (isInLightbox && !href.startsWith("/#")) {
        return; // Lass den Link normal funktionieren
      }
      
      // Nur auf Startseite verarbeiten (außer Links zur Startseite)
      if (!isOnHomepage() && !href.startsWith("/#")) {
        return; // Nicht auf Startseite und kein Link zur Startseite -> ignorieren
      }

      // JETZT: Accordion öffnen
      event.preventDefault();
      closeAllLightboxes();

      // Hash NICHT in URL setzen für Kontakt-Links
      if (id !== "kontakt" && window.location.hash !== '#' + id) {
        history.replaceState(null, '', '#' + id);
      } else if (id === "kontakt") {
        // Hash entfernen für Kontakt-Links
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }

      // Alle anderen Accordions schließen
      allAccordionInputs.forEach((other) => {
        if (other !== input && other.checked) {
          other.checked = false;
        }
      });

      // Accordion öffnen
      input.checked = true;
      syncAllHrElements();
      updateAccordionAria();

      // IMMER zum Accordion-Titel scrollen (auch bei Kontakt)
      scrollToAccordionContent(input);
    }); // BUBBLING PHASE - läuft NACH anderen Handlern


    // SPEZIELLER Event-Listener für "→ Kontakt aufnehmen" Links (author-contact-link)
    // Läuft in CAPTURE PHASE NACH Lightbox-Event-Listener, damit Lightbox-Öffnungen funktionieren
    document.addEventListener("click", function (event) {
      const contactLink = event.target.closest('a.author-contact-link[href^="/#kontakt"], a.author-contact-link[href^="#kontakt"]');
      if (!contactLink) return;
      
      const href = contactLink.getAttribute("href");
      if (!href) return;
      
      event.preventDefault();
      event.stopPropagation();
      
      // Lightbox schließen
      closeAllLightboxes();
      
      // Prüfe ob wir auf der Startseite sind
      if (!isOnHomepage()) {
        // Nicht auf Startseite: Zur Startseite navigieren
        window.location.href = href;
        return;
      }
      
      // Auf Startseite: Accordion öffnen
      const input = document.getElementById("tog5");
      if (!input) return;
      
      // Alle anderen Accordions schließen
      allAccordionInputs.forEach((other) => {
        if (other !== input && other.checked) {
          other.checked = false;
        }
      });
      
      // Accordion öffnen
      input.checked = true;
      syncAllHrElements();
      updateAccordionAria();
      
      // Hash NICHT in URL setzen
      history.replaceState(null, '', window.location.pathname + window.location.search);
      
      // Zum Accordion-Titel scrollen
      scrollToAccordionContent(input);
    }, true); // CAPTURE PHASE - läuft NACH Lightbox-Event-Listener (weil später registriert)

    // Eigene Formular-Validierung
    function validateForm(form) {
      let isValid = true;
      form.querySelectorAll(".field-error").forEach(el => el.remove());
      form.querySelectorAll(".input-error").forEach(el => el.classList.remove("input-error"));

      const messages = {
        name: "Bitte tragen Sie Ihren Namen ein.",
        email: "Bitte tragen Sie Ihre E-Mail-Adresse ein.",
        message: "Bitte tragen Sie Ihre Nachricht ein."
      };

      form.querySelectorAll("input[required], textarea[required]").forEach((field) => {
        const value = field.value.trim();
        const fieldName = field.name;
        let errorMsg = "";

        if (!value) {
          errorMsg = messages[fieldName] || "Bitte füllen Sie dieses Feld aus.";
          isValid = false;
        } else if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errorMsg = "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
          isValid = false;
        }

        if (errorMsg) {
          field.classList.add("input-error");
          const errorEl = document.createElement("span");
          errorEl.className = "field-error";
          errorEl.textContent = errorMsg;
          field.parentNode.appendChild(errorEl);
        }
      });

      return isValid;
    }

    document.querySelectorAll(".contact-form").forEach((form) => {
      // Zeitpunkt speichern, wenn Formular sichtbar wird
      let formOpenTime = Date.now();
      let formInitialized = false;

      // JavaScript-Token setzen (Bots ohne JS können das nicht)
      const jsTokenField = form.querySelector("#js-token-field");
      if (jsTokenField) {
        // Einfacher Token basierend auf aktueller Zeit und zufälligem Wert
        const token = btoa(Date.now().toString() + Math.random().toString()).substring(0, 16);
        jsTokenField.value = token;
      }

      // Intersection Observer: Zeitpunkt erfassen, wenn Formular sichtbar wird
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !formInitialized) {
            formOpenTime = Date.now();
            formInitialized = true;
          }
        });
      }, { threshold: 0.1 });

      observer.observe(form);

      form.addEventListener("submit", function (event) {
        event.preventDefault();

        if (!validateForm(this)) return;

        const section = this.closest(".contact-form-section");
        const successBox = section?.querySelector(".form-success");
        const errorBox = section?.querySelector(".form-error");
        const errorText = errorBox?.querySelector(".error-text");
        const submitBtn = this.querySelector(".form-submit");
        const originalText = submitBtn ? submitBtn.textContent : "";
        
        // Sicherstellen, dass Erfolgs- und Fehlermeldungen initial versteckt sind
        if (successBox) successBox.style.display = "none";
        if (errorBox) errorBox.style.display = "none";

        // Honeypot-Check: Alle Honeypot-Felder prüfen
        const honeypots = this.querySelectorAll('input[name="website"], input[name="url"], input[name="homepage"]');
        for (const honeypot of honeypots) {
          if (honeypot.value && honeypot.name !== "js_token") {
            // Spam erkannt, stillschweigend abbrechen
            return;
          }
        }

        // JavaScript-Token prüfen
        if (jsTokenField && !jsTokenField.value) {
          // Kein Token = Bot ohne JavaScript
          if (errorBox) {
            if (errorText) {
              errorText.textContent = "Bitte aktivieren Sie JavaScript in Ihrem Browser.";
            }
            fadeIn(errorBox, 300);
          }
          return;
        }

        // Zeitbasierte Validierung: Mindestens 5 Sekunden warten
        const timeOpen = Date.now() - formOpenTime;
        if (timeOpen < 5000) {
          if (errorBox) {
            if (errorText) {
              errorText.textContent = "Bitte warten Sie einen Moment, bevor Sie das Formular absenden.";
            }
            fadeIn(errorBox, 300);
          }
          return;
        }

        if (errorBox) errorBox.style.display = "none";
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "...";
        }

        // Formulardaten sammeln
        const formDataObj = new FormData(this);

        // An Cloudflare Worker senden
        fetch("https://kontaktformular.benni-schels.workers.dev", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams(formDataObj).toString(),
        })
          .then(async (res) => {
            const data = await res.json().catch(() => ({}));
            if (!res.ok && res.status !== 201) {
              const errorMsg = data.error || data.message || "Unbekannter Fehler";
              throw new Error(errorMsg);
            }
            fadeOut(form, 300, () => {
              if (successBox) fadeIn(successBox, 300);
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
              }
            });
          })
          .catch((error) => {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = originalText;
            }
            if (errorBox) {
              let errorMessage = "Bitte versuchen Sie es später erneut.";
              if (error.message && error.message !== "Unbekannter Fehler") {
                errorMessage = error.message;
              } else if (navigator.onLine === false) {
                errorMessage = "Keine Internetverbindung. Bitte prüfen Sie Ihre Verbindung.";
              }
              if (errorText) {
                errorText.textContent = errorMessage;
              }
              fadeIn(errorBox, 300);
            }
          });
      });
    });
  });

  // Tooltip positioning for social logos
  function positionTooltips() {
    const tooltipLogos = document.querySelectorAll('.social-logo[data-tooltip]');
    const hoveredLogos = new Set();
    
    const updateTooltipPosition = (logo) => {
      const rect = logo.getBoundingClientRect();
      
      // Calculate position: above the logo, centered
      const tooltipTop = rect.top - 30; // 30px above (tooltip height + gap)
      const tooltipLeft = rect.left + (rect.width / 2);
      const arrowTop = rect.top - 7;
      const arrowLeft = rect.left + (rect.width / 2);
      
      logo.style.setProperty('--tooltip-top', `${tooltipTop}px`);
      logo.style.setProperty('--tooltip-left', `${tooltipLeft}px`);
      logo.style.setProperty('--tooltip-arrow-top', `${arrowTop}px`);
      logo.style.setProperty('--tooltip-arrow-left', `${arrowLeft}px`);
    };
    
    tooltipLogos.forEach(logo => {
      logo.addEventListener('mouseenter', (e) => {
        hoveredLogos.add(logo);
        updateTooltipPosition(logo);
      });
      
      logo.addEventListener('mousemove', (e) => {
        updateTooltipPosition(logo);
      });
      
      logo.addEventListener('mouseleave', () => {
        hoveredLogos.delete(logo);
      });
    });
    
    // Update tooltip positions on scroll (only for hovered logos)
    let scrollTimeout = null;
    window.addEventListener('scroll', () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      scrollTimeout = setTimeout(() => {
        hoveredLogos.forEach(logo => {
          updateTooltipPosition(logo);
        });
      }, 10);
    }, { passive: true });
  }
  
  // Initialize tooltip positioning
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', positionTooltips);
  } else {
    positionTooltips();
  }
})();
