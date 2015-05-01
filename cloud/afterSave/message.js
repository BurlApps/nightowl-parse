Parse.Cloud.afterSave("Message", function(req, res) {
  var message = req.object
  var data = {
    message: message.id
  }

  Parse.Cloud.run("messagePusher", data)

  if(message.get("type") == 1) {
    Parse.Cloud.run("messagePush", data)
  }

  if(message.existed()) return

  Parse.Cloud.run("messageConversation", data)
})
