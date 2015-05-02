var User = Parse.User
var Message  = Parse.Object.extend("Message")
var Conversation = Parse.Object.extend("Conversation")

Parse.Cloud.define("migrationMessage", function(req, res) {
  Parse.Cloud.useMasterKey()

  var user = new User()
  var message = new Message()
  var conversation = new Conversation()
  var random = Math.random().toString(36).slice(2)

  user.set("username", random)
  user.set("password", random)

  user.signUp().then(function() {
    message.set("text", "")
    message.set("type", 0)
    message.set("user", user)

    return message.save()
  }).then(function() {
    var messages = conversation.relation("messages")

    conversation.set("user", user)
    conversation.set("unread", true)
    messages.add(message)

    return conversation.save()
  }).then(function() {
    return conversation.destroy()
  }).then(function() {
    return user.destroy()
  }).then(function() {
    return message.destroy()
  }).then(function() {
    res.success("Successfully added message class")
  }, function(error) {
    console.log(error)
    res.error(error.message)
  })
})
