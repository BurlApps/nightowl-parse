// Init
$(function() {
  $("#fileUpload").change(uploadTriggered)
  $(".image").on("touchstart click", function() {
    $(".header, .bottom").fadeToggle(500)
  })
})

// Utils
function uploadTriggered() {
  var Assignment = Parse.Object.extend("Assignment")
  var question = new Assignment()
  var file = new Parse.File("image.png", this.files[0])

  question.id = config.question
  $(".good span").text("UPLOADING")

  file.save().then(function() {
    question.set("state", 3)
    question.set("answer", file)
    return question.save()
  }).then(function() {
    alert("Question has been answered!")
    location.href = "/questions/" + question.id + "/answered"
  }, function(error) {
    alert(error.message)
  })
}
