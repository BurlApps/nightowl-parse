// Init
$(function() {
  var hidden = false
  window.startTutor = new Date()
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
  var uploadStart = new Date()
  var tutorTotal = (uploadStart - startTutor)/1000
  
  question.id = config.question
  $(".good span").text("UPLOADING")

  file.save().then(function() {
    return question.fetch()
  }).then(function() {
    payTutor = question.get("state") == 2

    question.set("state", 3)
    question.set("answer", file)
    console.log("file uploaded")
    return question.save()
  }).then(function() {
    var uploadEnd = new Date()
    var uploadTotal = (uploadEnd - uploadStart)/1000
    
    return mixpanel.track("Web.Question.Answered", {
      "Response Time": tutorTotal,
      "Upload Time": uploadTotal,
      "Tutor Name": config.tutorName,
      "Tutor ID": config.tutorID,
      "Creator Name": config.creatorName,
      "Creator ID": config.creatorID,
      "Question ID": config.question,
      "Subject ID": config.subjectID,
      "Subject Name": config.subjectName
    })
  }).then(function() {
    console.log("redirect")
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
                 