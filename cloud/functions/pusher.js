var Settings = require("cloud/utils/settings")
var MD5 = require("cloud/utils/md5")
var SHA = require("cloud/utils/sha256")
var Message = Parse.Object.extend("Message")

Parse.Cloud.define("notifyChatRoom", function(req, res) {
  Settings().then(function(settings) {
    req.settings = settings

    var message = new Message()
    message.id = req.params.message

    return message.fetch()
  }).then(function(message) {
    var now = new Date()
    var timestamp = parseInt(now.getTime() / 1000, 10)
    var account = req.settings.get("account").replace(/: /g, "_").toLowerCase()

    var data = JSON.stringify({
      data: JSON.stringify({
        message: message.get("text"),
        user: message.get("user").id,
        byUser: message.get("byUser"),
        created: message.createdAt
      }),
      name: "message.new",
      channel: account + "_chat_room"
    })

    var path = "/apps/" + req.settings.get("pusherId") + "/events"

    var parameters = [
      "auth_key=", req.settings.get("pusherKey"), "&auth_timestamp=", timestamp,
      "&auth_version=1.0&body_md5=", MD5(data),
    ].join("")

    var sha = new SHA([
      "POST", path, parameters
    ].join("\n"), "TEXT")

    var signature = sha.getHMAC(req.settings.get("pusherSecret"), "TEXT", "SHA-256", "HEX")

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
  }).then(function(data) {
    res.success("Notified Chat Room")
  }, function(error) {
    console.error(error)
    res.error(error.message)
  })
})
