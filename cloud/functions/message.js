var Message = Parse.Object.extend("Message")
var Conversation = Parse.Object.extend("Conversation")

Parse.Cloud.define("messagePush", function(req, res) {
  Parse.Cloud.useMasterKey()

  var message = new Message()
  message.id = req.params.message

  message.fetch().then(function() {
    return message.get("user").fetch()
  }).then(function(user) {
    if(user.get("phone")) {
      return Parse.Cloud.run("twilioMessage", {
        "To": user.get("phone"),
        "Body": message.get("text")
      })
    } else {
      var pushQuery = new Parse.Query(Parse.Installation)
      pushQuery.equalTo("user", user)

      return Parse.Push.send({
    	  where: pushQuery,
    	  data: {
          action: "support.message",
          sound: "alert.caf",
          message: message.get("text"),
          alert: "Support: " + message.get("text")
        }
  	  })
    }
  }).then(function() {
    res.success("Successfully sent push notification")
  }, function(error) {
    console.error(error)
    res.error(error.message)
  })
})

Parse.Cloud.define("messageConversation", function(req, res) {
  Parse.Cloud.useMasterKey()

  var message = new Message()
  message.id = req.params.message

  message.fetch().then(function() {
    var query = new Parse.Query(Conversation)

    query.equalTo("user", message.get("user"))
    return query.first()
  }).then(function(conversation) {
    if(conversation) return conversation

    conversation = new Conversation()
    conversation.set("user", message.get("user"))
    conversation.set("unread", true)
    return conversation.save()
  }).then(function(conversation) {
    var messages = conversation.relation("messages")
    messages.add(message)

    return conversation.save()
  }).then(function() {
    res.success("Successfully updated conversation")
  }, function(error) {
    console.error(error)
    res.error(error.message)
  })
})
