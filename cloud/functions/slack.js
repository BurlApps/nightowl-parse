var Mailgun = require('mailgun')
var Assignment = Parse.Object.extend("Assignment")
var Settings = require('cloud/utils/settings')

Parse.Cloud.define("notifySlack", function(req, res) {
  Parse.Cloud.useMasterKey()

  Settings().then(function(settings) {
    req.settings = settings
    var query = new Parse.Query(Assignment)

    query.equalTo("state", 1)
    return query.count()
  }).then(function(count) {
    return Parse.Cloud.httpRequest({
      url: req.settings.get("slackApi"),
      method: "POST",
      followRedirects: true,
      body: [
        "One of our users has posted a new question! There are a total of ",
        count, " waiting to be claimed."
      ].join("")
    })
  }).then(function(data) {
    res.success("Notified Admins on Slack")
  }, function(error) {
    console.log(error)
    res.error(error.message)
  })
})
