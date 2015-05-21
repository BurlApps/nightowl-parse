var User    = Parse.User
var Installation = Parse.Installation
var Message = Parse.Object.extend("Message")
var Assignment = Parse.Object.extend("Assignment")
var Settings = require('cloud/utils/settings')
var Moment = require('moment')

Parse.Cloud.job("statsSlack", function(req, res) {
  Parse.Cloud.useMasterKey()

  var yesterday = new Date()
  var today = new Date()

  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0,0,0,0)
  today.setHours(0,0,0,0)

  Settings().then(function(settings) {
    req.settings = settings

    var query = new Parse.Query(User)

    query.equalTo("source", "sms")
    query.lessThanOrEqualTo("createdAt", today)
    query.greaterThanOrEqualTo("createdAt", yesterday)

    return query.count()
  }).then(function(count) {
    req.smsCount = count

    var query = new Parse.Query(User)
    query.exists("card")

    return query.count()
  }).then(function(count) {
    req.userCardCount = count

    var query = new Parse.Query(User)
    query.greaterThan("charges", 0)

    return query.count()
  }).then(function(count) {
    req.userChargesCount = count

    var query = new Parse.Query(Assignment)

    query.notEqualTo("state", 0)
    query.lessThanOrEqualTo("createdAt", today)
    query.greaterThanOrEqualTo("createdAt", yesterday)

    return query.count()
  }).then(function(count) {
    req.questionsCount = count

    var query = new Parse.Query(Message)

    query.lessThanOrEqualTo("createdAt", today)
    query.greaterThanOrEqualTo("createdAt", yesterday)

    return query.count()
  }).then(function(count) {
    req.messageCount = count

    var query = new Parse.Query(User)

    query.equalTo("source", "ios")
    query.lessThanOrEqualTo("createdAt", today)
    query.greaterThanOrEqualTo("createdAt", yesterday)

    return query.count()
  }).then(function(count) {
    req.iOSCount = count

    return Parse.Cloud.httpRequest({
      url: req.settings.get("slackStats"),
      method: "POST",
      followRedirects: true,
      body: JSON.stringify({
        text: [
          "_Stats for *", Moment(yesterday).format("MMMM Do YYYY"), "*_\n",
          "New Users: *", (req.smsCount + req.iOSCount), "*\n",
          "New iOS Users: *", req.iOSCount, "*\n",
          "New SMS Users: *", req.smsCount, "*\n\n",
          "New Questions: *", req.questionsCount, "*\n",
          "New Messages: *", req.messageCount, "*\n\n",
          "Users w/Cards: *", req.userCardCount, "*\n",
          "Users w/Charges: *", req.userChargesCount, "*\n",
        ].join(""),
        username: req.settings.get("account"),
        icon_url: req.settings.get("host") + "/images/slack/notify.png"
      })
    })
  }).then(function(data) {
    res.success("Stats Updates on Slack")
  }, function(error) {
    console.error(error)
    res.error(error.message)
  })
})
