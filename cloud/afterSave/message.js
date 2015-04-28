Parse.Cloud.afterSave("Message", function(req, res) {
  var message = req.object
  var data = {
    message: message.id
  }

  if(message.get("byUser")) {
    Parse.Cloud.run("notifyChatRoom", {
      message: message.id
    })
  }
})
