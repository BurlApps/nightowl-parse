Parse.Cloud.afterSave("Message", function(req, res) {
  var message = req.object
  var data = {
    message: message.id
  }

  Parse.Cloud.run("notifyChatRoom", data)

  if(message.get("type") == 1) {
    Parse.Cloud.run("messagePush", data)
  }
})
