var Image = require("parse-image")
var Settings = require("cloud/utils/settings")

Parse.Cloud.afterSave("Assignment", function(req, res) {
  var question = req.object
  var data = {
    question: question.id
  }

  if(question.get("state") == 1) {
    Settings().then(function(settings) {
      return Parse.Cloud.httpRequest({
      		url: settings.get("host") + "/images/flagged/10.png"
      })
    }).then(function(response) {
  	  var image = new Image()
  	  return image.setData(response.buffer)
  	}).then(function(image) {
  	  return image.data()
  	}).then(function(buffer) {
  	  var file = new Parse.File("image.png", {
  			base64: buffer.toString("base64")
  		})

  	  return file.save()
  	}).then(function(image) {
    	question.set("state", 8)
  		question.set("answer", image)
  		return question.save()
  	}).then(function() {
      var pushQuery = new Parse.Query(Parse.Installation)
      
      pushQuery.equalTo("user", question.get("user"))
      
      Parse.Push.send({
        where: pushQuery,
        data: {
          action: "user.message",
          actions: "user.message",
          alert: "We are under maintenance and can't answer your question at this time :(",
          message: "We are under maintenance and can't answer your question at this time :(",
          title:  "Under Maintenance",
          sound: "alert.caf"
        }
      })
  	})
  }

/*
  if(question.existed()) {
    Parse.Cloud.run("assignmentPush", data)
  }

  switch(question.get("state")) {
    case 1:
    case 4:
    case 5:
    case 6:
      Parse.Cloud.run("newAssignmentSlack")
      break

    case 2:
      data.action = "claimed"
      Parse.Cloud.run("updateAssignmentSlack", data)
      break

    case 3:
      data.action = "completed"
      Parse.Cloud.run("updateAssignmentSlack", data)
      break

    case 7:
    case 8:
      data.action = "flagged"
      Parse.Cloud.run("updateAssignmentSlack", data)
      break

    case 9:
      data.action = "deleted"
      Parse.Cloud.run("updateAssignmentSlack", data)
      break
  }
*/
})
