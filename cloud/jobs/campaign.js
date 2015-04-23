var User = Parse.User
var Settings = require("cloud/utils/settings")
var Assignment = Parse.Object.extend("Assignment")

Parse.Cloud.job("zeroFreeCampaign", function(req, res) {
  Parse.Cloud.useMasterKey()

  var today = new Date()
  if(today.getDay() != 4) return res.success()

  Settings().then(function(settings) {
    var query = new Parse.Query(User)

    query.exists("phone")
    query.doesNotExist("card")
    query.equalTo("freeQuestions", 0)

    return query.each(function(user) {
      console.log(user.get("phone"))
      return Parse.Cloud.run("twilioMessage", {
        "Body": [
          "Hey :) Get 3 free questions if you enter payment info at: ",
          settings.get("host"), "/user/", user.id, "/card"
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
  if(today.getDay() != 4) return res.success()

  var query = new Parse.Query(User)

  query.exists("phone")
  query.equalTo("freeQuestions", 1)
  query.each(function(user) {
    return Parse.Cloud.run("twilioMessage", {
      "Body": "Hey :) just a reminder, you still have 1 free question w/ us!",
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
  if(today.getDay() != 4) return res.success()

  var query = new Parse.Query(User)
  var questionQuery = new Parse.Query(Assignment)

  query.doesNotMatchKeyInQuery("objectId", "creator", questionQuery)
  query.exists("phone")
  query.greaterThanOrEqualTo("freeQuestions", 2)
  query.each(function(user) {
    return Parse.Cloud.run("twilioMessage", {
      "Body": "Hey :) You should send in a question! Check us out.",
      "To": user.get("phone")
    })
  }).then(function() {
    res.success("Campaign successful")
  }, function(error) {
    console.log(error)
    res.error(error.message)
  })
})
