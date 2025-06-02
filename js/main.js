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

header, main, footer {
  background-color: var(--bg);
  padding-left: 8%;
  padding-right: 8%;
}
header { padding-bottom: 0; padding-top: 1em; }
main   { padding-top: 0; padding-bottom: 0; }
footer { padding-bottom: 2%; }

/* ========== Header: Zeile mit Flexbox ========== */
.header-row {
  display: flex;
  flex-direction: row;
  align-items: flex-end;   /* sorgt für Ausrichtung unten */
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
.language         { display: none; }
.language.active { display: block; }

/* ========== Accordion/Kategorien ========== */
.cat {
  cursor: pointer;
  font-weight: 400;
  font-size: 1.2em;
  margin: 0;
  letter-spacing: 0.2em;
}
[id^="tog"] { display: none; }
.cat_text {
  max-height: 0;
  overflow: hidden;
  transition: max-height .5s;
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

label.cat[for^="tog"]::before {
  content: "+";
  display: inline-block;
  font-weight: bold;
  color: currentColor;
  margin-right: 0.3em; /* Abstand reduziert */
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

label.cat[for^="tog"].expanded::before {
  content: "−";
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
em, i           { font-style: italic; font-weight: 400; }
strong          { font-weight: 400; }
ul              { list-style-type: square; text-align: left; }
ol              { list-style-type: upper-roman; text-align: left; }
li              { list-style-type: square; }
.small          { text-align: center; margin: 0; padding: 0; }
.content        { font-size: 1.2em; margin: 2% 0 2% 0; padding: 0; }
blockquote      { font-style: italic; text-align: center; padding: 0 5%; hyphens: manual; }
blockquote p        { text-align: right;  hyphens: manual; }
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
}

/* ========== Links und Hover-Styles ========== */
a:link, a:visited {
  text-decoration-style: dotted;
  color: var(--body);
}
a:hover,
.cat-link:hover,
.lb-link:hover,
label:hover {
  color: var(--hover-text);
  background-color: var(--hover-bg);
  transition: color .2s, background .2s;
}

/* ========== Header-Link und Social-Icons: Blau beim Hover ========== */
.title-link,
.logo,
.logo-ru,
.mini-title-link,
.footer_l .logo {
  transition: color 0.3s, background 0.3s;
}
.title-link:hover,
.logo:hover {
  color: var(--accent) !important;
  background-color: transparent !important;
}
.footer_l .logo:hover,
.footer_l .logo:focus {
  color: var(--accent) !important;
  background: transparent !important;
}
@media (min-width: 768px) {
  .logo-ru:hover,
  .mini-title-link:hover {
    color: var(--accent) !important;
    background: transparent !important;
  }
}

/* ========== Restliche Link-Gruppen ========== */
.cat-link, .lb-link {
  text-transform: uppercase;
  margin: 0;
}
.lb-link {
  margin-right: 4%;
  margin-bottom: 4%;
  list-style-position: inside;
}
.logo { padding-left: 4%; padding-right: 4%; text-align: center; }

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
.l_linkedin-in, .l_envelope, .l_heart { width: 1.2em; margin: 0 .6em; }

.arrow, .arrow-nohover {
  margin: 0;
  font-size: 1em;
}

.arrow::before {
  content: '+';
  display: inline-block;
  margin-right: 0.3em; /* Abstand reduziert */
  font-weight: normal;
  color: currentColor;
  vertical-align: middle;
  letter-spacing: normal;
}

.arrow-nohover::before {
  content: '+';
  display: inline-block;
  margin-right: 0.3em; /* Abstand reduziert */
  font-weight: normal;
  color: var(--body);
  vertical-align: middle;
  letter-spacing: normal;
}

/* ========== Footer, Lightbox, Overlay ========== */
.lb_footer {
  font-size: 150%;
  text-transform: uppercase;
  position: fixed;
  margin: 0 auto;
  left: 4%; right: 4%; top: 85%; bottom: 30%;
  max-width: 27em; z-index: 2;
}
.lb_close    { float: right; }
.lb_language { float: left; }
.white {
  background-color: var(--bg);
  text-transform: lowercase;
}
.white:hover {
  color: var(--hover-text);
  background-color: var(--hover-bg);
}
.footer_l { display: flex; flex-flow: row nowrap; justify-content: center; margin: 2%; }
.footer_t { display: flex; flex-flow: row nowrap; justify-content: center; margin-top: 4%; }
.footer_l .logo svg { fill: currentColor; transition: fill 0.3s; vertical-align: middle; }

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
.logo-ru { display: none; }
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
    text-decoration: none;
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
.title-link { text-decoration: none; color: var(--primary); pointer-events: auto; }
.title-text span { display: block; }
hr { margin: 0; }
hr.y { height: 1.6em; border: none; background: var(--bg); }
hr.z { height: 1px; border: none; background: var(--body); }

/* ========== Responsive für Smartphones & Tablets ========== */
@media (max-width: 630px) {
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
  /* Accordion und Labels besser lesbar */
  .cat, label {
    font-size: 1.05em;
    letter-spacing: 0.18em;
  }

  .logo-ru {
    display: none !important;
  }
}
