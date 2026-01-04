#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to update author section in all article HTML files to use unified text.
"""

import os
import re
from pathlib import Path

# Unified author text
UNIFIED_AUTHOR_TEXT = """            <p>Benjamin Schels, Architekt M.A., ist Inhaber des Architekturbüro Schels mit Sitz in Wolnzach im Landkreis Pfaffenhofen an der Ilm. Die Inhalte basieren auf praktischer Erfahrung aus der architektonischen Planungspraxis und dienen der sachlichen Orientierung für Bauherren. Sie ersetzen keine individuelle Prüfung des konkreten Einzelfalls. Ein unverbindliches Erstgespräch kann helfen, die dargestellten Themen auf ein konkretes Bauvorhaben einzuordnen. <a href="/#kontakt" class="author-contact-link">→ Kontakt aufnehmen</a></p>"""

def update_author_section(file_path):
    """Update author section in a single HTML file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if file has author section
        if 'author-section' not in content:
            return False
        
        # Pattern to match the entire author-text div content
        # This matches from <div class="author-text"> to </div> (closing tag)
        pattern = r'(<div class="author-text">\s*)(.*?)(\s*</div>)'
        
        def replace_author_text(match):
            indent = match.group(1)
            closing = match.group(3)
            return indent + UNIFIED_AUTHOR_TEXT + closing
        
        new_content = re.sub(pattern, replace_author_text, content, flags=re.DOTALL)
        
        if new_content != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True
        return False
    
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    """Update all article HTML files."""
    artikel_dir = Path(__file__).parent / "artikel"
    
    if not artikel_dir.exists():
        print(f"Directory {artikel_dir} not found!")
        return
    
    updated_files = []
    skipped_files = []
    
    for html_file in artikel_dir.glob("*.html"):
        if update_author_section(html_file):
            updated_files.append(html_file.name)
            print(f"✓ Updated: {html_file.name}")
        else:
            skipped_files.append(html_file.name)
    
    print(f"\nSummary:")
    print(f"Updated: {len(updated_files)} files")
    print(f"Skipped: {len(skipped_files)} files")
    
    if updated_files:
        print(f"\nUpdated files: {', '.join(updated_files)}")

if __name__ == "__main__":
    main()
