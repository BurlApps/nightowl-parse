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
      body: JSON.stringify({
        text: [
          "One of our users has posted a new question! There are a total of ",
          count, " waiting to be claimed."
        ].join(""),
        username: req.settings.get("account") + " - Notify",
        icon_url: req.settings.get("host") + "/images/slack/notify.png"
      })
    })
  }).then(function(data) {
    res.success("Notified Admins on Slack")
  }, function(error) {
    console.log(error)
    res.error(error.message)
  })
})

Parse.Cloud.define("updateSlack", function(req, res) {
  Parse.Cloud.useMasterKey()

  Settings().then(function(settings) {
    req.settings = settings
    req.question = new Assignment()
    req.question.id = req.params.question

    return req.question.fetch()
  }).then(function(question) {
    return question.get("tutor").fetch()
  }).then(function(tutor) {
    return tutor.get("user").fetch()
  }).then(function(tutor) {
    req.tutor = tutor

    return req.question.get("creator").fetch()
  }).then(function(user) {
    var phone = user.get("phone")
    var action = req.params.action
    action = action.charAt(0).toUpperCase() + action.slice(1)

    return Parse.Cloud.httpRequest({
      url: req.settings.get("slackApi"),
      method: "POST",
      followRedirects: true,
      body: JSON.stringify({
        text: [
          req.tutor.get("name"), " (", req.tutor.id, ") just ", req.params.action , " question (",
          req.question.id, ") created by (", user.id, ") from ", (phone ? phone : "the app")
        ].join(""),
        username: req.settings.get("account") + " - " + action,
        icon_url: [
          req.settings.get("host"), "/images/slack/", req.params.action, ".png"
        ].join("")
      })
    })
  }).then(function(data) {
    res.success("Notified Admins on Slack")
  }, function(error) {
    console.log(error)
    res.error(error.message)
  })
})
