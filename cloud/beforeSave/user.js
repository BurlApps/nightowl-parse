var Settings = require("cloud/utils/settings")

Parse.Cloud.beforeSave(Parse.User, function(req, res) {
  var user = req.object

  Settings().then(function(settings) {
    user.set("tutoring", !!user.get("tutoring"))
    user.set("tutorEmail", !!user.get("tutorEmail"))
    user.set("unsubscribe", !!user.get("unsubscribe"))

    if(!user.get("source")) user.set("source", "ios")
    if(!user.isNew()) return

    if(!user.get("charges")) user.set("charges", 0)
    if(!user.get("freeQuestions")) user.set("freeQuestions", settings.get("freeQuestions"))
  }).then(function() {
    res.success()
  }, function(error) {
    res.error(error.message)
  })
})
