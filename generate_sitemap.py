#!/usr/bin/env python3
"""
Automatische Generierung der sitemap.xml
Findet alle HTML-Dateien und erstellt eine korrekte Sitemap mit ISO 8601 Datumsformat.
"""

import os
import re
from datetime import datetime
from pathlib import Path

BASE_URL = "https://schels.info"
SITEMAP_FILE = "sitemap.xml"

# Prioritäten für verschiedene Seiten
PRIORITIES = {
    "/": 1.0,
    "/artikel/": 0.7,
    "/artikel/hoai.html": 0.8,
    "/artikel/leistungsphasen.html": 0.8,
    "/artikel/baugenehmigung.html": 0.8,
    "/artikel/kostenbasis-architektur.html": 0.8,
    "/artikel/architekt-kosten.html": 0.8,
    "/artikel/haus-bauen-architekt.html": 0.8,
    "/artikel/flaechen-begriffe.html": 0.8,
    "/artikel/genehmigungsfrei.html": 0.8,
    "/pages/impressum.html": 0.3,
    "/pages/datenschutz.html": 0.3,
}

# Change-Frequenzen
CHANGEFREQ = {
    "/": "weekly",
    "/artikel/": "monthly",
    "/pages/impressum.html": "yearly",
    "/pages/datenschutz.html": "yearly",
}

def get_lastmod():
    """Gibt aktuelles Datum im ISO 8601 Format zurück"""
    return datetime.now().strftime("%Y-%m-%dT12:00:00+01:00")

def find_html_files():
    """Findet alle HTML-Dateien, die indexiert werden sollen"""
    urls = []
    
    # Homepage
    if os.path.exists("index.html"):
        urls.append({
            "loc": f"{BASE_URL}/",
            "priority": PRIORITIES.get("/", 1.0),
            "changefreq": CHANGEFREQ.get("/", "weekly"),
            "images": [
                {
                    "loc": f"{BASE_URL}/images/benjamin-schels-portrait.webp",
                    "title": "Benjamin Schels - Architekt M.A.",
                    "caption": "Inhaber architekturbüro schels, Wolnzach"
                },
                {
                    "loc": f"{BASE_URL}/images/abs-logo.svg",
                    "title": "architekturbüro schels Logo"
                }
            ]
        })
    
    # Seiten im pages-Verzeichnis
    pages_dir = Path("pages")
    if pages_dir.exists():
        for file in sorted(pages_dir.glob("*.html")):
            rel_path = f"/pages/{file.name}"
            urls.append({
                "loc": f"{BASE_URL}{rel_path}",
                "priority": PRIORITIES.get(rel_path, 0.3),
                "changefreq": CHANGEFREQ.get(rel_path, "yearly"),
            })
    
    # Artikel-Verzeichnis
    artikel_dir = Path("artikel")
    if artikel_dir.exists():
        # Artikel-Übersicht
        if (artikel_dir / "index.html").exists():
            urls.append({
                "loc": f"{BASE_URL}/artikel/",
                "priority": PRIORITIES.get("/artikel/", 0.7),
                "changefreq": CHANGEFREQ.get("/artikel/", "monthly"),
            })
        
        # Einzelne Artikel
        for file in sorted(artikel_dir.glob("*.html")):
            if file.name != "index.html":
                rel_path = f"/artikel/{file.name}"
                urls.append({
                    "loc": f"{BASE_URL}{rel_path}",
                    "priority": PRIORITIES.get(rel_path, 0.7),
                    "changefreq": "monthly",
                })
    
    return urls

def generate_sitemap():
    """Generiert die sitemap.xml"""
    urls = find_html_files()
    lastmod = get_lastmod()
    
    xml = ['<?xml version="1.0" encoding="UTF-8"?>']
    xml.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">')
    
    for url_data in urls:
        xml.append("<url>")
        xml.append(f"<loc>{url_data['loc']}</loc>")
        xml.append(f"<lastmod>{lastmod}</lastmod>")
        xml.append(f"<changefreq>{url_data['changefreq']}</changefreq>")
        xml.append(f"<priority>{url_data['priority']}</priority>")
        
        # Hreflang für Homepage
        if url_data['loc'] == f"{BASE_URL}/":
            xml.append(f'<xhtml:link rel="alternate" hreflang="de" href="{BASE_URL}/"/>')
        
        # Bilder für Homepage
        if 'images' in url_data:
            for img in url_data['images']:
                xml.append("<image:image>")
                xml.append(f"<image:loc>{img['loc']}</image:loc>")
                xml.append(f"<image:title>{img['title']}</image:title>")
                if 'caption' in img:
                    xml.append(f"<image:caption>{img['caption']}</image:caption>")
                xml.append("</image:image>")
        
        xml.append("</url>")
    
    xml.append("</urlset>")
    
    return "\n".join(xml)

def main():
    """Hauptfunktion"""
    print("Generiere sitemap.xml...")
    
    sitemap_content = generate_sitemap()
    
    with open(SITEMAP_FILE, 'w', encoding='utf-8') as f:
        f.write(sitemap_content)
    
    # Statistik
    urls = find_html_files()
    print(f"✅ Sitemap generiert: {len(urls)} URLs")
    print(f"📄 Datei: {SITEMAP_FILE}")

if __name__ == "__main__":
    main()
