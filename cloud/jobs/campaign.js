var User = Parse.User
var Settings = require("cloud/utils/settings")
var Assignment = Parse.Object.extend("Assignment")

Parse.Cloud.job("zeroFreeCampaign", function(req, res) {
  Parse.Cloud.useMasterKey()

  var today = new Date()
  if(today.getDay() != 3) return res.success()

  Settings().then(function(settings) {
    var query = new Parse.Query(User)

    query.equalTo("source", "sms")
    query.notEqualTo("unsubscribe", true)
    query.doesNotExist("card")
    query.equalTo("freeQuestions", 0)

    return query.each(function(user) {
      return Parse.Cloud.run("twilioMessage", {
        "Body": [
          "Hey Night Owl here :) Get 3 free questions if you enter payment info at: ",
          settings.get("host"), "/user/", user.id, "/card. Unsubscribe by replying: UNSUBSCRIBE"
        ].join(""),
        "To": user.get("phone")
      })
    })
  }).then(function() {
    res.success("Campaign successful")
  }, function(error) {
    console.log(error)
    res.error(error.message)
  })
})

Parse.Cloud.job("oneFreeCampaign", function(req, res) {
  Parse.Cloud.useMasterKey()

  var today = new Date()
  if(today.getDay() != 3) return res.success()

  var query = new Parse.Query(User)

  query.equalTo("source", "sms")
  query.equalTo("freeQuestions", 1)
  query.notEqualTo("unsubscribe", true)

  query.each(function(user) {
    return Parse.Cloud.run("twilioMessage", {
      "Body": "Hey Night Owl here :) just a reminder, you still have 1 free question w/ us! Unsubscribe by replying: UNSUBSCRIBE",
      "To": user.get("phone")
    })
  }).then(function() {
    res.success("Campaign successful")
  }, function(error) {
    console.log(error)
    res.error(error.message)
  })
})

Parse.Cloud.job("twoFreeNewCampaign", function(req, res) {
  Parse.Cloud.useMasterKey()

  var today = new Date()
  if(today.getDay() != 3) return res.success()

  var query = new Parse.Query(User)
  var questionQuery = new Parse.Query(Assignment)

  query.doesNotMatchKeyInQuery("objectId", "creator", questionQuery)
  query.equalTo("source", "sms")
  query.greaterThanOrEqualTo("freeQuestions", 2)
  query.notEqualTo("unsubscribe", true)

  query.each(function(user) {
    return Parse.Cloud.run("twilioMessage", {
      "Body": "Hey Night Owl here :) You should send in a question! Check us out. Unsubscribe by replying: UNSUBSCRIBE",
      "To": user.get("phone")
    })
  }).then(function() {
    res.success("Campaign successful")
  }, function(error) {
    console.log(error)
    res.error(error.message)
  })
})
