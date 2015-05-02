var Settings = require("cloud/utils/settings")
var MD5 = require("cloud/utils/md5")
var SHA = require("cloud/utils/sha256")
var Message = Parse.Object.extend("Message")
var Conversation = Parse.Object.extend("Conversation")

Parse.Cloud.define("messagePusher", function(req, res) {
  var message = new Message()

  message.id = req.params.message

  message.fetch().then(function(message) {
    return message.get("user").fetch()
  }).then(function(user) {
    return pusher({
      data: {
        id: message.id,
        text: message.get("text"),
        user: {
          id: user.id,
          name: user.get("name") || user.get("phone")
        },
        type: message.get("type"),
        created: message.createdAt
      },
      event: "message.new",
      channel: "chat_room"
    })
  }).then(function(data) {
    res.success("Notified Chat Room: Message")
  }, function(error) {
    console.error(error)
    res.error(error.message)
  })
})

Parse.Cloud.define("conversationPusher", function(req, res) {
  var conversation = new Conversation()

  conversation.id = req.params.conversation

  conversation.fetch().then(function() {
    return pusher({
      data: {
        user: {
          id: conversation.get("user").id
        },
        unread: conversation.get("unread"),
        updated: conversation.updatedAt
      },
      event: "message.read",
      channel: "chat_room"
    })
  }).then(function(data) {
    res.success("Notified Chat Room: Read")
  }, function(error) {
    console.error(error)
    res.error(error.message)
  })
})

function pusher(params) {
  return Settings().then(function(settings) {
    var now = new Date()
    var timestamp = parseInt(now.getTime() / 1000, 10)
    var account = settings.get("account").replace(/: /g, "_").toLowerCase()

    var data = JSON.stringify({
      data: JSON.stringify(params.data),
      name: params.event,
      channel: account + "_" + params.channel
    })

    var path = "/apps/" + settings.get("pusherId") + "/events"

    var parameters = [
      "auth_key=", settings.get("pusherKey"), "&auth_timestamp=", timestamp,
      "&auth_version=1.0&body_md5=", MD5(data),
    ].join("")

    var sha = new SHA([
      "POST", path, parameters
    ].join("\n"), "TEXT")

    var signature = sha.getHMAC(settings.get("pusherSecret"), "TEXT", "SHA-256", "HEX")

    return Parse.Cloud.httpRequest({
      url: [
        "http://api.pusherapp.com", path, "?",
        parameters, "&auth_signature=", signature
      ].join(""),
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      followRedirects: true,
      body: data
    })
  })
}
