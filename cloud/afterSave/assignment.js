var Settings = require("cloud/utils/settings")
var Mailgun = require('mailgun')

Parse.Cloud.afterSave("Assignment", function(req, res) {
  var assignment = req.object

  if(assignment.get("state") != 1) return
  Parse.Cloud.run("notifyTutors")
  Parse.Cloud.run("notifySlack")
})
