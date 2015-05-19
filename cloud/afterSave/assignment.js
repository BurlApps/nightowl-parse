Parse.Cloud.afterSave("Assignment", function(req, res) {
  var question = req.object
  var data = {
    question: question.id
  }

  Parse.Cloud.run("assignmentPush", data)

  switch(question.get("state")) {
    case 1:
    case 4:
    case 5:
    case 6:
      Parse.Cloud.run("notifyTutors")
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
})
