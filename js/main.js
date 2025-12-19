(() => {
  "use strict";
  const accordionState = new Map();

  function loadPage(page, targetId, cb) {
    const cacheBust = "?_t=" + Date.now();
    fetch(`/pages/${page}.html${cacheBust}`)
      .then((res) => (res.ok ? res.text() : Promise.reject()))
      .then((html) => {
        document.getElementById(targetId).innerHTML = html;
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
    const fade = document.getElementById("fade");
    if (fade) {
      fade.addEventListener("click", function () {
        document.querySelectorAll(".white_content").forEach((el) => (el.style.display = "none"));
        fade.style.display = "none";
      });
    }

    document.querySelectorAll('input[type="radio"][name="rdo"]').forEach((input) => {
      accordionState.set(input.id, input.checked);
    });

    document.querySelectorAll('label.cat[for^="tog"]').forEach((label) => {
      label.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.click();
        }
      });
    });

    document.querySelectorAll('input[type="radio"][name="rdo"]').forEach((input) => {
      input.addEventListener("click", function () {
        const prevState = accordionState.get(this.id);
        document.querySelectorAll('input[type="radio"][name="rdo"]').forEach((other) => {
          if (other !== this) {
            other.checked = false;
            accordionState.set(other.id, false);
            // HR im Label wieder anzeigen wenn Bereich eingeklappt wird
            const otherLabel = document.querySelector(`label[for="${other.id}"]`);
            if (otherLabel) {
              const hrInLabel = otherLabel.querySelector('hr.z');
              if (hrInLabel) hrInLabel.style.display = '';
            }
          }
        });
        this.checked = !prevState;
        accordionState.set(this.id, !prevState);
        // HR im Label verstecken/anzeigen basierend auf checked Status
        const label = document.querySelector(`label[for="${this.id}"]`);
        if (label) {
          const hrInLabel = label.querySelector('hr.z');
          if (hrInLabel) {
            hrInLabel.style.display = this.checked ? 'none' : '';
          }
        }
        updateAccordionAria();
      });
    });

    // Initial: HR in Labels verstecken wenn Bereich bereits ausgeklappt ist
    document.querySelectorAll('input[type="radio"][name="rdo"]').forEach((input) => {
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
        document.querySelectorAll('input[type="radio"][name="rdo"]').forEach((other) => {
          if (other !== input) {
            other.checked = false;
            accordionState.set(other.id, false);
          }
        });
        input.checked = true;
        accordionState.set(accordionId, true);
        updateAccordionAria();
      }
      
      // Scroll zu Section oder Label
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
      } else if (input) {
        const label = document.querySelector(`label.cat[for="${accordionId}"]`);
        if (label) {
          const y = label.getBoundingClientRect().top + window.pageYOffset - 20;
          window.scrollTo({ top: y, behavior: "smooth" });
          setTimeout(() => label.focus(), 300);
        }
      }
    });

    document.addEventListener("click", function (event) {
      const closeBtn = event.target.closest("[data-close-lightbox]");
      if (!closeBtn) return;
      event.preventDefault();
      const id = closeBtn.dataset.closeLightbox;
      const panel = document.getElementById(id);
      const fadeOverlay = document.getElementById("fade");
      if (panel) panel.style.display = "none";
      if (fadeOverlay) fadeOverlay.style.display = "none";
    });

    document.addEventListener("click", function (event) {
      if (event.target.closest("[data-open-impressum]")) {
        event.preventDefault();
        kb_source_2_impressum();
      }
    });

    document.addEventListener("click", function (event) {
      if (event.target.closest("[data-open-datenschutz]")) {
        event.preventDefault();
        kb_source_2_datenschutz();
      }
    });

    document.addEventListener("click", function (event) {
      if (event.target.closest("[data-open-vita]")) {
        event.preventDefault();
        kb_source_2_vita();
      }
    });

    document.querySelectorAll(".contact-form").forEach((form) => {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        const section = this.closest(".contact-form-section");
        const successBox = section?.querySelector(".form-success");
        const errorBox = section?.querySelector(".form-error");
        const errorText = errorBox?.querySelector(".error-text");
        const submitBtn = this.querySelector(".form-submit");
        const originalText = submitBtn ? submitBtn.textContent : "";

        if (errorBox) errorBox.style.display = "none";
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "...";
        }

        const formData = new FormData(this);
        fetch(this.action, {
          method: "POST",
          body: formData,
          headers: { Accept: "application/json" },
        })
          .then(async (res) => {
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
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
