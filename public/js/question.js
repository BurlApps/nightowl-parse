// Init
$(function() {
  var hidden = false
  $("#fileUpload").change(uploadTriggered)
  $(".flag").click(flagQuestion)
  $(".flagModal .background").click(cancelFlag)
})

// Utils
function uploadTriggered() {
  var Assignment = Parse.Object.extend("Assignment")
  var question = new Assignment()
  var file = new Parse.File("image.png", this.files[0])
  var payTutor = false

  question.id = config.question
  $(".good span").text("UPLOADING")

  file.save().then(function() {
    return question.fetch()
  }).then(function() {
    payTutor = question.get("state") == 2

    question.set("state", 3)
    question.set("answer", file)
    return question.save()
  }).then(function() {
    alert("Question has been answered!")

    if(payTutor) {
      location.href = "/questions/" + question.id + "/answered"
    } else {
      location.href = "/questions/"
    }
  }, function(error) {
    alert(error.message)
  })
}

function flagQuestion() {
  $(".flagModal").fadeIn(500)
}

function cancelFlag() {
  $(".flagModal").fadeOut(500)
}
