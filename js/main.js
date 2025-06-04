/*******************************************************
* Theme Name:    Architekturbüro Schels
* Author:        Benjamin Schels
* Version:       3.3
* www.schels.info
*******************************************************/

/* ========== Zentrale Variablen ========== */
:root {
  color-scheme: light dark;
  --primary: #000;
  --bg: #fff;
  --body: #000;
  --accent: blue;
  --hover-bg: #000;
  --hover-text: #fff;
  --font-main: 'Montserrat', 'Arial', sans-serif;
}

/* ========== Schriftarten-Einbindung ========== */
@font-face {
  font-family: 'Montserrat';
  font-style: normal;
  font-weight: 300;
  src: url('../fonts/montserrat-v24-latin-300.woff2') format('woff2'),
       url('../fonts/montserrat-v24-latin-300.woff') format('woff');
}
@font-face {
  font-family: 'Montserrat';
  font-style: normal;
  font-weight: 400;
  src: url('../fonts/montserrat-v24-latin-regular.woff2') format('woff2'),
       url('../fonts/montserrat-v24-latin-regular.woff') format('woff');
}
@font-face {
  font-family: 'Montserrat';
  font-style: italic;
  font-weight: 300;
  src: url('../fonts/montserrat-v24-latin-300italic.woff2') format('woff2'),
       url('../fonts/montserrat-v24-latin-300italic.woff') format('woff');
}
@font-face {
  font-family: 'Montserrat';
  font-style: italic;
  font-weight: 400;
  src: url('../fonts/montserrat-v24-latin-italic.woff2') format('woff2'),
       url('../fonts/montserrat-v24-latin-italic.woff') format('woff');
}

/* ========== Grundlayout & Body ========== */
body {
  background: var(--bg);
  color: var(--body);
  font-family: var(--font-main);
  font-weight: 300;
  width: 70%;
  max-width: 60em; min-width: 10em;
  margin: auto;
  padding-bottom: 2%;
  font-size: 1em;
  text-align: left;
  hyphens: manual;
}

header, main {
  background-color: var(--bg);
  padding-left: 8%;
  padding-right: 8%;
}
footer { /* Haupt-Footer Styling */
  background-color: var(--bg);
  padding-left: 8%;
  padding-right: 8%;
  padding-bottom: 2%;
}
header { padding-bottom: 0; padding-top: 1em; }
main    { padding-top: 0; padding-bottom: 0; }


/* ========== Header: Zeile mit Flexbox ========== */
.header-row {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 0.2em;
}
.title-wrapper {
  margin-bottom: 0;
}
.header-lang {
  display: flex;
  align-items: flex-end;
}
.language-select {
  float: none; /* alten float aufheben */
}

/* ========== Sprachumschalter ========== */
.language          { display: none; }
.language.active { display: block; }

.language-select a.switch-language {
  text-transform: lowercase;
  color: var(--body);
  font-size: 0.85em;
  text-decoration-line: underline;
  text-decoration-style: dotted;
  text-decoration-color: var(--body);
  text-underline-offset: 3px;
  padding: 0.1em 0.2em;
}
.language-select a.switch-language:hover {
  color: var(--hover-text);
  background-color: var(--hover-bg);
  text-decoration-color: var(--hover-text);
}


/* ========== Accordion/Kategorien ========== */
.cat {
  cursor: pointer;
  font-weight: 400;
  font-size: 1.2em;
  margin: 0;
  letter-spacing: 0.2em;
}

/* Stil für Unterkategorien */
label.cat.cat-sub {
  padding-left: 1.5em; /* Einzug für Unterkategorien */
  font-size: 1.1em; /* Etwas kleinere Schrift als Hauptkategorien */
  letter-spacing: 0.15em; /* Leichter angepasster Buchstabenabstand */
}

[id^="tog"] { display: none; }
.cat_text {
  max-height: 0;
  overflow: hidden;
  transition: max-height .5s;
}

/* Stil für Inhalte der Unterkategorien */
.cat_text.cat_text-sub {
  padding-left: 2em; /* Einzug für den Inhalt der Unterkategorien */
  padding-right: 2em; /* Eventuell auch rechts einziehen */
  margin-top: 0.5em; /* Etwas Abstand nach oben */
  margin-bottom: 1em; /* Etwas Abstand nach unten */
}


input[type=radio]:checked ~ .cat_text { max-height: 1000px; }

label {
  cursor: pointer;
  display: block;
  margin: 0;
}

label.cat[for^="tog"] {
  position: relative;
}

/* Plus-Symbol für Hauptkategorien */
label.cat[for^="tog"]::before {
  content: "+";
  display: inline-block;
  font-weight: bold;
  color: currentColor;
  margin-right: 0.3em;
  vertical-align: middle;
  letter-spacing: normal;
}

/* Pfeil-Symbol für Unterkategorien */
label.cat.cat-sub .arrow::before {
  content: '→'; /* Anderes Symbol für Unterkategorien */
  display: inline-block;
  margin-right: 0.3em;
  color: currentColor; /* Farbe vom Elternelement erben */
  vertical-align: middle;
  letter-spacing: normal;
}

label.cat[for^="tog"] > div.language.active {
  display: inline-block;
  vertical-align: middle;
}

label.cat[for^="tog"] > div.language.active > h2.cat,
label.cat[for^="tog"] > div.language.active > p.cat {
  display: inline;
  margin: 0;
}

/* Minus-Symbol für geöffnete Hauptkategorien */
label.cat[for^="tog"].expanded::before {
  content: "−";
}

/* Pfeil-Symbol für geöffnete Unterkategorien */
label.cat.cat-sub.expanded .arrow::before {
  content: '↓'; /* Symbol für geöffneten Zustand der Unterkategorien */
}


/* ========== Typografie ========== */
h1 {
  font-weight: 300;
  text-align: left;
  letter-spacing: 0.2em;
}
h2 {
  font-weight: 400;
  margin: 0;
  text-align: left;
  letter-spacing: 0.2em;
}
h3, h4, h5, h6 { font-weight: 400; text-align: left; }
em, i          { font-style: italic; font-weight: 400; }
strong         { font-weight: 400; }
ul             { list-style-type: square; text-align: left; }
ol             { list-style-type: upper-roman; text-align: left; }
li             { list-style-type: square; }
.small         { text-align: center; margin: 0; padding: 0; }
.content       { font-size: 1.2em; margin: 2% 0 2% 0; padding: 0; }
blockquote     { font-style: italic; text-align: center; padding: 0 5%; hyphens: manual; }
blockquote p         { text-align: right;  hyphens: manual; }
blockquote p.says   { text-align: center; hyphens: manual; }

/* ========== Tabellen für Übersichtlichkeit ========== */
table {
  border-collapse: collapse;
  width: 100%;
  hyphens: manual;
  text-align: left;
}
td {
  vertical-align: top;
  hyphens: manual;
  text-align: left;
  padding: 0.2em 0;
}
tr:nth-child(odd) { background: hsla(360,0%,80%,0.2); }

/* ========== Formulareingaben resetten ========== */
input[type=text], input[type=button] {
  -webkit-appearance: none;
  -webkit-border-radius: 0;
}

/* ========== Bilder und Profilbild ========== */
.top {
  display: block;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
}
.profile {
  float: right;
  position: absolute;
  right: 2%;
  width: 20%;
  border-radius: 50%;
  transition: 0.2s;
  opacity: 1;
  cursor: pointer;
  display: none;
}

/* ========== Links und Hover-Styles ========== */
a:link, a:visited {
  text-decoration-style: dotted;
  text-decoration-line: underline;
  text-decoration-color: var(--body);
  text-underline-offset: 2px;
  color: var(--body);
}
a:hover {
  color: var(--hover-text);
  background-color: var(--hover-bg);
  text-decoration-color: var(--hover-text);
}

label.cat[for^="tog"]:hover {
  color: var(--hover-text);
  background-color: var(--hover-bg);
}


/* ========== Header-Link und Social-Icons: Blau beim Hover ========== */
.title-link,
.logo,
.logo-ru,
.mini-title-link {
  transition: color 0.3s, background 0.3s;
  text-decoration: none !important;
  border-bottom: none !important;
}
.title-link:hover,
.logo:hover {
  color: var(--accent) !important;
  background-color: transparent !important;
}

@media (min-width: 768px) {
  .logo-ru:hover,
  .mini-title-link:hover {
    color: var(--accent) !important;
    background: transparent !important;
  }
}

/* ========== Restliche Link-Gruppen (entfernt, da jetzt Labels) ========== */
/* .cat-link {
  text-transform: uppercase;
  margin: 0;
  transition: background-color .2s;
}
.cat-link a {
  display: block;
  padding: 0.2em 0;
}

.cat-link:hover {
  background-color: var(--hover-bg);
}
.cat-link:hover a {
  color: var(--hover-text);
  background-color: transparent;
  text-decoration-color: var(--hover-text);
} */


.lb-link {
  text-transform: uppercase;
  list-style-position: inside;
}

/* ========== SVG & Icons ========== */
svg, .switcher_color, .switcher_theme {
  width: 100%;
  height: 100%;
  fill: var(--primary);
  stroke: var(--primary);
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.arrow, .arrow-nohover {
  margin: 0;
  font-size: 1em;
  font-weight: 400;
}
#content4 .arrow-nohover { /* Adresse im Kontaktbereich */
    font-size: 0.85em;
}

/* Die spezifischen Pfeile für Hauptkategorien und Unterkategorien werden
   jetzt durch die label.cat[for^="tog"]::before und label.cat.cat-sub .arrow::before
   Regeln definiert. Diese hier sind jetzt generischer.
*/
/* .arrow::before {
  content: '+';
  display: inline-block;
  margin-right: 0.3em;
  color: currentColor;
  vertical-align: middle;
  letter-spacing: normal;
} */

.arrow-nohover::before {
  content: '+';
  display: inline-block;
  margin-right: 0.3em;
  color: var(--body);
  vertical-align: middle;
  letter-spacing: normal;
}

/* ========== Footer, Lightbox, Overlay (entfernt) ========== */
/* .lb_footer {
  font-size: 150%;
  text-transform: uppercase;
  position: fixed;
  margin: 0 auto;
  left: 4%; right: 4%; top: 85%; bottom: 30%;
  max-width: 27em; z-index: 2;
}
.lb_close     { float: right; }
.lb_language { float: left; }
.lb_language a.switch-language {
  text-transform: lowercase;
  color: var(--body);
  font-size: 0.85em;
  text-decoration-line: underline;
  text-decoration-style: dotted;
  text-decoration-color: var(--body);
  text-underline-offset: 3px;
  padding: 0.1em 0.2em;
  margin: 0 0.2em;
}
.lb_language a.switch-language:hover {
  color: var(--hover-text);
  background-color: var(--hover-bg);
  text-decoration-color: var(--hover-text);
}


.white {
  background-color: var(--bg);
  text-transform: lowercase;
}

.black_overlay {
  display: none;
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background-color: var(--bg);
  opacity: .8;
  filter: alpha(opacity=80);
}
.white_content {
  display: none;
  position: fixed;
  text-align: justify;
  hyphens: auto;
  -webkit-hyphens: auto;
  margin: 0 auto;
  top: 15%; left: 2%; right: 2%;
  max-width: 50em; min-width: 10em; min-height: 10em; height: 72%;
  padding: 8px;
  border: 0.2em solid var(--primary);
  background-color: var(--bg);
  z-index: 1;
  overflow: auto;
} */

/* ========== Footer-Inhalt (Name links, Links rechts) ========== */
.footer-bottom-container {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 1em 0;
  flex-wrap: wrap;
}

.footer-info-left {
  font-size: 0.85em;
  color: var(--body);
  margin-right: 1em; /* Abstand zu den rechten Links auf großen Bildschirmen */
  flex-shrink: 0;
}
/* Stile für die neuen Spans innerhalb von .footer-info-left */
.footer-info-left .footer-name-title,
.footer-info-left .footer-address-line {
  display: inline; /* Standardmäßig nebeneinander */
}
.footer-info-left .footer-name-title::after {
  content: " - "; /* Trennzeichen für Desktop-Ansicht */
  white-space: pre; /* Erhält das Leerzeichen um den Bindestrich */
}


.footer-legal-links {
  text-align: right;
  flex-shrink: 0;
  /* Anpassung für die neuen Footer-Links, da sie jetzt Labels sind */
  display: flex; /* Um sie nebeneinander zu halten, wenn Platz ist */
  gap: 1em; /* Abstand zwischen den Links */
}

.footer-legal-links > div { /* .lb-link und .datenschutz-b */
  display: block; /* Machen wir sie zu Blöcken für den Label-Click-Bereich */
  /* margin-left: 1em; -- wird jetzt durch gap gesetzt */
  text-transform: uppercase;
}

/* Entfernt, da wir jetzt Labels und nicht Anker haben */
/* .footer-legal-links > div:first-child {
  margin-left: 0;
} */

.footer-legal-links label.cat { /* Direkte Ansprache der Labels im Footer */
  font-size: 0.85em; /* Einheitliche Größe */
  color: var(--body);
  text-decoration-line: underline;
  text-decoration-style: dotted;
  text-decoration-color: var(--body);
  text-underline-offset: 3px;
  display: inline-block;
  padding: 0.3em 0.6em;
  border-radius: 3px;
  transition: color .2s, background-color .2s, text-decoration-color .2s;
  letter-spacing: normal; /* Normaler Buchstabenabstand hier */
}

/* Hover-Effekt für die Footer-Labels */
.footer-legal-links label.cat:hover {
  color: var(--hover-text);
  background-color: var(--hover-bg);
  text-decoration-color: var(--hover-text);
}

/* Die Spans mit Klasse white sollten ihren Hintergrund nicht ändern,
   da sie nur für die Textfarbe der Lightbox-Buttons gedacht waren */
.footer-legal-links label.cat span.white {
  background-color: transparent !important;
  color: inherit !important; /* Farbe vom Elternelement erben */
  padding: 0;
  display: inline;
}

/* Plus/Minus Symbol für die Footer-Labels */
.footer-legal-links label.cat::before {
    content: '+'; /* Standard Plus-Symbol */
    margin-right: 0.3em;
    font-weight: bold;
    color: currentColor;
}

.footer-legal-links label.cat.expanded::before {
    content: '−'; /* Minus-Symbol wenn geöffnet */
}


/* ========== Tooltip ========== */
.tooltip { position: relative; display: inline-block; }
.tooltip .tooltiptext {
  visibility: hidden;
  width: 7.5em;
  background-color: var(--primary);
  color: var(--bg);
  text-align: center;
  padding: 5px 0;
  position: absolute;
  z-index: 3;
  bottom: 150%;
  left: 50%;
  margin-left: -3.7em;
}
.tooltip .tooltiptext::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -0.6em;
  border-width: 0.6em;
  border-style: solid;
  border-color: var(--primary) transparent transparent transparent;
}
.tooltip:hover .tooltiptext { visibility: visible; }

/* ========== Responsive: Logo & Titel unten rechts ab 768px ========== */
@media (min-width: 830px) {
  .logo-ru {
    position: fixed;
    bottom: 2%; right: 2%;
    z-index: 1;
    background: transparent;
    padding: 0.5em;
    text-align: left;
    font-size: 0.8em;
    line-height: 1.1;
    letter-spacing: 0.1em;
    display: block;
  }
  .mini-title-link {
    text-decoration: none !important;
    border-bottom: none !important;
    color: var(--body);
    font-weight: 400;
    display: inline-block;
    transition: color 0.3s;
    background: transparent;
  }
}

/* ========== Titelbereich & horizontale Linien ========== */
.title-wrapper {
  display: inline-block;
  text-align: left;
  font-weight: 400;
  font-size: 1.6em;
  letter-spacing: 0.2em;
  line-height: 1.2;
}
.title-link {
   text-decoration: none !important;
   border-bottom: none !important;
   color: var(--primary);
   pointer-events: auto;
}
.title-text span { display: block; }
hr { margin: 0; }
hr.y { height: 1.6em; border: none; background: var(--bg); }
hr.z {
    height: 1px;
    border: none;
    background: var(--body);
    margin: 0;
}
.cat_text > hr.z {
    margin-top: 1.5em;
}


/* ========== Responsive für Smartphones & Tablets ========== */
@media (max-width: 810px) { /* Breakpoint geändert auf 810px */
  body {
    width: 90%;
    padding-left: 2%;
    padding-right: 2%;
    font-size: 1em;
    min-width: 0;
    max-width: none;
  }
  header, main, footer {
    padding-left: 0;
    padding-right: 0;
  }
  .header-row {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 0.6em;
    gap: 0.2em;
  }
  .header-lang {
    width: 100%;
    justify-content: flex-end;
    margin-top: 0.2em;
  }
  .title-wrapper {
    width: 100%;
    margin-bottom: 0;
  }
  .title-text {
    font-size: 1.3em;
    line-height: 1.15;
    letter-spacing: 0.18em;
  }
  .cat, label {
    font-size: 1.05em;
    letter-spacing: 0.18em;
  }

  /* Anpassung für Unterkategorien auf mobilen Geräten */
  label.cat.cat-sub {
    padding-left: 0.5em; /* Weniger Einzug mobil */
    font-size: 1em; /* Passende Schriftgröße */
  }

  .cat_text.cat_text-sub {
    padding-left: 1em; /* Weniger Einzug mobil */
    padding-right: 1em;
  }

  .logo-ru {
    display: none !important;
  }

  /* Footer-Anpassungen für diesen Breakpoint */
  .footer-bottom-container {
    flex-direction: column;
    align-items: center;
  }
  .footer-info-left {
    margin-bottom: 0.5em; /* Etwas weniger Abstand als zuvor, da Name/Titel und Adresse jetzt getrennt werden können */
    margin-right: 0;
    text-align: center;
    width: 100%;
    font-size: 0.85em; /* Einheitliche Größe */
  }
  /* NEU: Stile für die unterteilten Info-Zeilen im Footer bei schmaler Ansicht */
  .footer-info-left .footer-name-title,
  .footer-info-left .footer-address-line {
    display: block; /* Untereinander anordnen */
    text-align: center; /* Sicherstellen, dass jede Zeile zentriert ist */
  }
  .footer-info-left .footer-name-title::after {
    content: ""; /* Trennzeichen im mobilen Layout entfernen */
  }
  .footer-info-left .footer-name-title {
       margin-bottom: 0.2em; /* Kleiner Abstand zwischen Name/Titel und Adresse */
  }


  .footer-legal-links {
    text-align: center;
    width: 100%;
    flex-direction: column; /* Auch im Footer die Links untereinander */
    gap: 0.4em; /* Abstand zwischen den gestapelten Links */
  }
  .footer-legal-links > div { /* Impressum/Datenschutz Blöcke */
    display: block;
    margin: 0.4em auto; /* Etwas weniger Abstand zwischen den gestapelten Links */
  }
    .footer-legal-links label.cat { /* Direkte Ansprache der Labels im Footer */
    font-size: 0.85em; /* Einheitliche Größe */
    padding: 0.2em 0.4em; /* Ggf. Padding anpassen für mobile Ansicht */
  }
}
