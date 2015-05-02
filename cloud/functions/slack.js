var Mailgun = require('mailgun')
var Assignment = Parse.Object.extend("Assignment")
var Settings = require('cloud/utils/settings')

Parse.Cloud.define("newAssignmentSlack", function(req, res) {
  Parse.Cloud.useMasterKey()

  Settings().then(function(settings) {
    req.settings = settings
    var query = new Parse.Query(Assignment)

    query.equalTo("state", 1)
    return query.count()
  }).then(function(count) {
    var queueLink = [
      "<", req.settings.get("host"), "/questions|Answer Questions>"
    ].join("")


    return Parse.Cloud.httpRequest({
      url: req.settings.get("slackQuestions"),
      method: "POST",
      followRedirects: true,
      body: JSON.stringify({
        text: [
          "One of our users has posted a new question! There are a total of *",
          count, "* waiting to be claimed. ", queueLink
        ].join(""),
        username: req.settings.get("account") + " - Notify",
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

Parse.Cloud.define("updateAssignmentSlack", function(req, res) {
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

    var questionLink = [
      "<", req.settings.get("host"), "/questions/",
      req.question.id, "/peek|", req.question.id, ">"
    ].join("")

    var userLink = [
      "<", req.settings.get("host"), "/chat/",
      user.id, "/|", user.id, ">"
    ].join("")

    return Parse.Cloud.httpRequest({
      url: req.settings.get("slackQuestions"),
      method: "POST",
      followRedirects: true,
      body: JSON.stringify({
        text: [
          req.tutor.get("name"), " (*", req.tutor.id, "*) just ", req.params.action , " question (*",
          questionLink, "*) created by (*", userLink, "*) from ", (phone ? phone : "the app")
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
    console.error(error)
    res.error(error.message)
  })
})
