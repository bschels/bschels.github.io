#!/usr/bin/env python3
"""
Findet die tatsächlichen Breadcrumb-Elemente auf einer Nextcloud Share-Seite
"""
import pexpect
import sys

SERVER_IP = "46.224.150.138"
PASSWORD = "mmbm3LTn7kju"

print("🔍 Finde Breadcrumb-Elemente...")
print("Bitte öffne eine öffentliche Share-Seite in deinem Browser")
print("und führe dann in der Browser-Konsole (F12) aus:")
print("")
print("document.querySelectorAll('[class*=\"breadcrumb\"], [class*=\"crumb\"], nav').forEach(el => {")
print("  console.log('Element:', el.tagName, el.className, el.id);")
print("  console.log('  Display:', window.getComputedStyle(el).display);")
print("  console.log('  Visibility:', window.getComputedStyle(el).visibility);")
print("  console.log('  Opacity:', window.getComputedStyle(el).opacity);")
print("  console.log('  Text:', el.textContent.trim().substring(0, 50));")
print("});")
print("")
print("Oder sende mir eine öffentliche Share-URL, dann kann ich es direkt testen.")
