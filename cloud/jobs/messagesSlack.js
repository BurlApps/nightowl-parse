var Conversation = Parse.Object.extend("Conversation")
var Settings = require('cloud/utils/settings')

Parse.Cloud.job("messagesSlack", function(req, res) {
  Parse.Cloud.useMasterKey()

  Settings().then(function(settings) {
    req.settings = settings
    var query = new Parse.Query(Conversation)

    query.equalTo("unread", true)
    return query.count()
  }).then(function(count) {
    if(count == 0) return true

    var chatLink = [
      "<", req.settings.get("host"), "/chat|Read Messages>"
    ].join("")

    return Parse.Cloud.httpRequest({
      url: req.settings.get("slackChatRoom"),
      method: "POST",
      followRedirects: true,
      body: JSON.stringify({
        text: [
          "There are *", count, "* unread conversations from our users. ", chatLink
        ].join(""),
        username: req.settings.get("account"),
        icon_url: req.settings.get("host") + "/images/slack/notify.png"
      })
    })
  }).then(function(data) {
    res.success("Notified Admins on Slack")
  }, function(error) {
    console.error(error)
    res.error(error.message)
  })
})
