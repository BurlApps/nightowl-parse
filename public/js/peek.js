$(function() {
  var hidden = false
  $(".image").on("touchstart mousedown", function() {
    if(hidden) {
      $(".header, .bottom").fadeIn(500)
    } else {
      $(".header, .bottom").fadeOut(500)
    }

    hidden = !hidden
  })
})
