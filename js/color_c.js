// color changer 
function getRandomColor() {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

const btn = document.getElementById("heart");

btn.addEventListener("click", () => {
document.documentElement.style.setProperty('--primary_r', getRandomColor());

});
