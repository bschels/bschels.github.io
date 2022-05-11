function colorToHex(color) {
    if (color.substr(0, 1) === '#') {
        return color;
    }
    var digits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(color);
    var red = parseInt(digits[2]);
    var green = parseInt(digits[3]);
    var blue = parseInt(digits[4]);
    var rgb = blue | (green << 8) | (red << 16);
    return digits[1] + '#' + rgb.toString(16);
};

function changeColor(from, to) {
   var elements = document.getElementsByTagName('*');
   for (var i=0;i<elements.length;i++) {
      var color = window.getComputedStyle(elements[i]).color;
      var hex = colorToHex(color);
      if (hex == from) {
         elements[i].style.color=to;
      }
      var backgroundColor = window.getComputedStyle(elements[i]).backgroundColor;
      if (backgroundColor.indexOf('rgba')<0) {
          var hex = colorToHex(backgroundColor);
          if (hex == from) {
             elements[i].style.backgroundColor=to;
          }
      }

   }
}   

// change all red color styled elements to blue
document.getElementById('test').onclick = function() {
   changeColor('#002FA7','#1234');
}
