var Assignment = Parse.Object.extend("Assignment")
var Tutor = Parse.Object.extend("Tutor")
var Settings = require('cloud/utils/settings')

Parse.Cloud.define("createTutorSlack", function(req, res) {
  var tutor = new Tutor()

  tutor.id = req.params.tutor

  Settings().then(function(settings) {
    req.settings = settings

    return tutor.fetch()
  }).then(function() {
    return tutor.get("user").fetch()
  }).then(function(user) {
    var now = new Date()
    var timestamp = parseInt(now.getTime() / 1000, 10)
    var names = user.get("name").split(" ")

    return Parse.Cloud.httpRequest({
      url: [
        req.settings.get("slackApiTutors"), "/users.admin.invite",
        "?t=", timestamp
      ].join(""),
      method: "POST",
      followRedirects: true,
      body: {
        email: user.get("email"),
        first_name: names[0],
        token: req.settings.get("slackTokenTutors"),
        set_active: true,
        _attempts: 1
      }
    })
  }).then(function(data) {
    console.log(data.text)
    res.success("Notified Admins of New Tutor Slack")
  }, function(error) {
    console.error(error)
    res.error(error.message)
  })
})

Parse.Cloud.define("newTutorSlack", function(req, res) {
  var tutor = new Tutor()

  tutor.id = req.params.tutor

  Settings().then(function(settings) {
    req.settings = settings

    return tutor.fetch()
  }).then(function() {
    return tutor.get("user").fetch()
  }).then(function(user) {
    return Parse.Cloud.httpRequest({
      url: req.settings.get("slackGeneral"),
      method: "POST",
      followRedirects: true,
      body: JSON.stringify({
        text: [
          user.get("name"), " registered as a tutor. Please activate their account <",
          req.settings.get("host"), "/tutor/", tutor.id,
          "/activate|here>."
        ].join(""),
        username: req.settings.get("account") + " - Notify",
        icon_url: req.settings.get("host") + "/images/slack/notify.png"
      })
    })
  }).then(function(data) {
    res.success("Notified Admins of New Tutor Slack")
  }, function(error) {
    console.error(error)
    res.error(error.message)
  })
})

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
