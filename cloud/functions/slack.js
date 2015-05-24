var Assignment = Parse.Object.extend("Assignment")
var Tutor = Parse.Object.extend("Tutor")
var Settings = require('cloud/utils/settings')

Parse.Cloud.define("newAssignmentSlack", function(req, res) {
  var query = new Parse.Query(Tutor)
  var date = new Date().getUTCHours()

  query.exists("slack")
  query.equalTo("enabled", true)
  query.lessThanOrEqualTo("start", date)
  query.greaterThan("end", date)

  query.find(function(tutors) {
    return Parse.Cloud.run("notifyAssignmentSlack", {
      channels: tutors.map(function(tutor) {
        return tutor.get("slack")
      })
    })
  }).then(function(data) {
    res.success("Notified Tutors on Slack")
  }, function(error) {
    console.error(error)
    res.error(error.message)
  })
})

Parse.Cloud.define("notifyAssignmentSlack", function(req, res) {
  Parse.Cloud.useMasterKey()

  Settings().then(function(settings) {
    req.settings = settings

    if(req.params.count) return req.params.count

    var query = new Parse.Query(Assignment)

    query.equalTo("state", 1)
    return query.count()
  }).then(function(count) {
    var queueLink = [
      "<", req.settings.get("host"), "/questions|Answer Questions>"
    ].join("")

    var data = {
      text: [
        "One of our users has posted a new question! There are a total of *",
        count, "* waiting to be claimed. ", queueLink
      ].join(""),
      username: req.settings.get("account") + " - Notify",
      icon_url: req.settings.get("host") + "/images/slack/notify.png"
    }

    var channels = req.params.channels || [""]

    return channels.forEach(function(channel) {
      data.channel = channel

      return Parse.Cloud.httpRequest({
        url: req.settings.get("slackQuestions"),
        method: "POST",
        followRedirects: true,
        body: JSON.stringify(data)
      })
    })
  }).then(function(data) {
    res.success("Notified Tutors on Slack")
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
    res.success("Notified Tutors on Slack")
  }, function(error) {
    console.error(error)
    res.error(error.message)
  })
})
