<?php
/**
 * Register JavaScript for the schels theme
 * This script injects the logo JavaScript into layout.base.php
 */

$template_file = \OC::$SERVERROOT . '/core/templates/layout.base.php';
$script_file = __DIR__ . '/../../core/js/logo-inject.js';

if (file_exists($script_file) && file_exists($template_file)) {
    $js_code = file_get_contents($script_file);
    
    $template_content = file_get_contents($template_file);
    
    // Prüfe, ob Script bereits eingefügt wurde
    if (strpos($template_content, 'schels-logo-container') === false) {
        $script_tag = '<script>' . $js_code . '</script>';
        $template_content = str_replace('</body>', $script_tag . "\n</body>", $template_content);
        
        file_put_contents($template_file, $template_content);
    }
}
