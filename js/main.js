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
      
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (!label) return;
      
      // Vorherige Scroll-Locks aufräumen
      if (activeScrollLock) {
        clearInterval(activeScrollLock.interval);
        activeScrollLock = null;
      }
      
      // Scroll-Position während der Transition einfrieren
      let scrollLocked = true;
      const currentScrollY = window.pageYOffset || window.scrollY;
      
      const lockScroll = () => {
        if (scrollLocked) {
          window.scrollTo({ top: currentScrollY, behavior: "auto" });
        }
      };
      
      // Scroll-Lock während der Transition aktiv halten
      const lockInterval = setInterval(lockScroll, 10);
      activeScrollLock = { interval: lockInterval };
      
      // Nach CSS-Transition (500ms) scrollen
      setTimeout(() => {
        if (activeScrollLock && activeScrollLock.interval === lockInterval) {
          clearInterval(lockInterval);
          activeScrollLock = null;
        }
        scrollLocked = false;
        
        // Mehrfaches requestAnimationFrame für präzise Positionierung
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const rect = label.getBoundingClientRect();
            const scrollY = window.pageYOffset || window.scrollY;
            const targetY = scrollY + rect.top;
            const finalY = Math.max(0, targetY - 2);
            
            window.scrollTo({ top: finalY, behavior: "smooth" });
          });
        });
      }, 520); // Etwas früher als Transition-Ende für flüssigeres Verhalten
    }

    // Optimierter Event-Handler: Reduziert Code-Duplikation und verbessert Performance
    allAccordionInputs.forEach((input) => {
      input.addEventListener("change", function () {
        const isChecked = this.checked;
        const label = document.querySelector(`label[for="${this.id}"]`);
        
        // Scroll-Position sofort einfrieren, um nativen Browser-Scroll zu verhindern
        if (isChecked) {
          const currentScrollY = window.pageYOffset || window.scrollY;
          window.scrollTo({ top: currentScrollY, behavior: "auto" });
        }
        
        accordionState.set(this.id, isChecked);
        
        // HR im Label verstecken/anzeigen
        if (label) {
          const hrInLabel = label.querySelector("hr.z");
          if (hrInLabel) hrInLabel.style.display = isChecked ? "none" : "";
        }
        
        // Andere Accordions schließen (nur wenn dieses geöffnet wird)
        if (isChecked) {
          allAccordionInputs.forEach((other) => {
            if (other !== this && other.checked) {
              other.checked = false;
              accordionState.set(other.id, false);
              const otherLabel = document.querySelector(`label[for="${other.id}"]`);
              if (otherLabel) {
                const otherHr = otherLabel.querySelector("hr.z");
                if (otherHr) otherHr.style.display = "";
              }
            }
          });
        }
        
        updateAccordionAria();
        
        // Scroll zum Label beim Öffnen (besonders wichtig auf mobil)
        if (isChecked) {
          scrollToAccordionContent(this);
        }
      });
    });

    // Toggle-Verhalten: Wenn auf bereits geöffnetes Accordion geklickt wird, schließen
    allAccordionLabels.forEach((label) => {
      label.addEventListener("click", function (event) {
        const id = this.getAttribute("for");
        const input = id ? document.getElementById(id) : null;
        if (!input) return;
        
        // Wenn bereits geöffnet, schließen (Toggle)
        if (input.checked) {
          event.preventDefault();
          event.stopPropagation();
          input.checked = false;
          // change-Event wird automatisch ausgelöst und kümmert sich um den Rest
        }
        // Wenn geschlossen, native Verhalten erlauben (input wird automatisch checked)
      });

      label.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.click();
        }
      });
    });
    
    // Optimiert: Einzelner Event-Handler für alle Accordion-Labels (Event-Delegation)
    // Dies reduziert die Anzahl der Event-Listener

    // Initial: HR in Labels verstecken wenn Bereich bereits ausgeklappt ist
    allAccordionInputs.forEach((input) => {
      if (input.checked) {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (label) {
          const hrInLabel = label.querySelector('hr.z');
          if (hrInLabel) hrInLabel.style.display = 'none';
        }
      }
    });

    updateAccordionAria();

    document.addEventListener("click", function (event) {
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
        event.preventDefault();
        // Accordion öffnen - change-Event manuell auslösen falls nötig
        if (!input.checked) {
          input.checked = true;
          // change-Event wird automatisch ausgelöst
        } else {
          // Falls bereits geöffnet, nur scrollen
          const label = document.querySelector(`label.cat[for="${accordionId}"]`);
          if (label) {
            const rect = label.getBoundingClientRect();
            const scrollY = window.pageYOffset || window.scrollY;
            const targetY = scrollY + rect.top;
            window.scrollTo({ top: Math.max(0, targetY - 2), behavior: "smooth" });
          }
        }
        // Focus-Management nach Scroll
        setTimeout(() => {
          const label = document.querySelector(`label.cat[for="${accordionId}"]`);
          if (label) {
            label.focus();
          }
        }, 600);
        return; // Scroll wird vom change-Event-Handler übernommen
      }
      
      // Scroll zu Section (nur wenn kein Accordion-Input gefunden wurde)
      if (section) {
        event.preventDefault();
        const y = section.getBoundingClientRect().top + window.pageYOffset - 20;
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
