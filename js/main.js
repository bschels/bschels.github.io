(() => {
  "use strict";
  const accordionState = new Map();

  function loadPage(page, targetId, cb) {
    const cacheBust = "?_t=" + Date.now();
    fetch(`/pages/${page}.html${cacheBust}`)
      .then((res) => (res.ok ? res.text() : Promise.reject()))
      .then((html) => {
        // Parse HTML und extrahiere nur den Inhalt aus .cat_text
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const content = doc.querySelector('.cat_text');
        if (content) {
          // Entferne Header und Footer falls vorhanden
          content.querySelectorAll('header, footer').forEach(el => el.remove());
          document.getElementById(targetId).innerHTML = content.innerHTML;
        } else {
          // Fallback: Versuche main zu finden
          const main = doc.querySelector('main');
          if (main) {
            main.querySelectorAll('header, footer').forEach(el => el.remove());
            document.getElementById(targetId).innerHTML = main.innerHTML;
          } else {
            document.getElementById(targetId).innerHTML = html;
          }
        }
        cb && cb();
      })
      .catch(() => {
        document.getElementById(targetId).innerHTML =
          "<p>Fehler beim Laden. Bitte versuchen Sie es erneut.</p>";
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

  function updateAccordionAria() {
    document.querySelectorAll('input[type="radio"][name="rdo"]').forEach((input) => {
      const label = document.querySelector(`label.cat[for="${input.id}"]`);
      if (!label) return;
      if (input.checked) {
        label.classList.add("expanded");
        label.setAttribute("aria-expanded", "true");
      } else {
        label.classList.remove("expanded");
        label.setAttribute("aria-expanded", "false");
      }
    });
  }

  window.kb_source_2_datenschutz = function () {
    loadPage("datenschutz", "datenschutz", () => {});
    document.getElementById("datenschutz-p").style.display = "block";
    document.getElementById("fade").style.display = "block";
  };

  window.kb_source_2_impressum = function () {
    loadPage("impressum", "impressum", () => {});
    document.getElementById("impressum-p").style.display = "block";
    document.getElementById("fade").style.display = "block";
  };

  window.kb_source_2_vita = function () {
    document.getElementById("vita-p").style.display = "block";
    document.getElementById("fade").style.display = "block";
  };

  document.addEventListener("DOMContentLoaded", function () {
    // Cache häufig verwendete Elemente
    const fade = document.getElementById("fade");
    const allAccordionInputs = document.querySelectorAll('input[type="radio"][name="rdo"]');
    const allAccordionLabels = document.querySelectorAll('label.cat[for^="tog"]');
    const allWhiteContent = document.querySelectorAll(".white_content");
    
    // Helper-Funktionen für bessere Performance
    const getScrollY = () => window.pageYOffset || window.scrollY;
    const getLabelForInput = (inputId) => document.querySelector(`label[for="${inputId}"]`);
    const getLabelCatForInput = (inputId) => document.querySelector(`label.cat[for="${inputId}"]`);
    
    // ZENTRALE Funktion: Synchronisiert ALLE HR-Elemente basierend auf dem aktuellen Zustand
    function syncAllHrElements() {
      allAccordionInputs.forEach((input) => {
        const label = getLabelForInput(input.id);
        if (label) {
          const hrInLabel = label.querySelector("hr.z");
          if (hrInLabel) {
            // HR verstecken wenn Accordion offen, anzeigen wenn geschlossen
            hrInLabel.style.display = input.checked ? "none" : "block";
          }
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

    document.addEventListener("click", function (event) {
      // Lightbox-Links zuerst prüfen (haben auch href="#")
      if (event.target.closest("[data-open-impressum], [data-open-datenschutz], [data-open-vita]")) {
        return; // Wird vom Lightbox-Handler verarbeitet
      }
      
      const target = event.target.closest('a[href^="#"]');
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href === "#") return;
      const id = href.substring(1);
      
      // Mapping für SEO-freundliche IDs zu Accordion-IDs
      const idMap = {
        "profil": "tog1",
        "leistungen": "tog3",
        "projekte": "tog4",
        "kontakt": "tog5"
      };
      
      const accordionId = idMap[id] || id;
      const input = document.getElementById(accordionId);
      const section = document.getElementById(id);
      
      if (input) {
        // WICHTIG: preventDefault SOFORT, bevor der Browser scrollt
        event.preventDefault();
        event.stopPropagation();
        
        // Hash mit replaceState setzen (verhindert Browser-Scroll)
        if (window.location.hash !== '#' + id) {
          history.replaceState(null, '', '#' + id);
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
        
        // Spezialbehandlung für #kontakt: Zum Formular scrollen statt zum Titel
        if (id === "kontakt") {
          setTimeout(() => {
            const form = document.getElementById("contact-form-de");
            if (form) {
              form.scrollIntoView({ behavior: "smooth", block: "start" });
            } else {
              // Fallback zum Label
              scrollToAccordionContent(input);
            }
          }, 550);
        } else {
          // Normale Accordions: Zum Titel scrollen
          scrollToAccordionContent(input);
        }
        return;
      }
      
      // Scroll zu Section (nur wenn kein Accordion-Input gefunden wurde)
      if (section) {
        event.preventDefault();
        const y = section.getBoundingClientRect().top + getScrollY() - 20;
        window.scrollTo({ top: y, behavior: "smooth" });
        // Focus-Management für Accessibility
        setTimeout(() => {
          const firstFocusable = section.querySelector('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
          if (firstFocusable) {
            firstFocusable.focus();
          } else {
            section.setAttribute('tabindex', '-1');
            section.focus();
            section.removeAttribute('tabindex');
          }
        }, 300);
      }
    });

    // Optimiert: Alle Lightbox-Event-Listener in einem Handler
    document.addEventListener("click", function (event) {
      // Lightbox schließen - mit stopPropagation um sicherzustellen, dass der Klick nicht von anderen Elementen abgefangen wird
      const closeBtn = event.target.closest("[data-close-lightbox]");
      if (closeBtn) {
        event.preventDefault();
        event.stopPropagation();
        const id = closeBtn.dataset.closeLightbox;
        const panel = document.getElementById(id);
        if (panel) panel.style.display = "none";
        if (fade) fade.style.display = "none";
        return;
      }
      
      // Lightbox öffnen - Impressum
      if (event.target.closest("[data-open-impressum]")) {
        event.preventDefault();
        kb_source_2_impressum();
        return;
      }
      
      // Lightbox öffnen - Datenschutz
      if (event.target.closest("[data-open-datenschutz]")) {
        event.preventDefault();
        kb_source_2_datenschutz();
        return;
      }
      
      // Lightbox öffnen - Vita
      if (event.target.closest("[data-open-vita]")) {
        event.preventDefault();
        kb_source_2_vita();
        return;
      }
    });

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
      form.addEventListener("submit", function (event) {
        event.preventDefault();

        if (!validateForm(this)) return;

        const section = this.closest(".contact-form-section");
        const successBox = section?.querySelector(".form-success");
        const errorBox = section?.querySelector(".form-error");
        const errorText = errorBox?.querySelector(".error-text");
        const submitBtn = this.querySelector(".form-submit");
        const originalText = submitBtn ? submitBtn.textContent : "";

        // Honeypot-Check: Wenn website-Feld ausgefüllt ist, abbrechen (Spam)
        const honeypot = this.querySelector(".website-field");
        if (honeypot && honeypot.value) {
          // Spam erkannt, stillschweigend abbrechen
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
              if (submitBtn) submitBtn.textContent = originalText;
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
})();
