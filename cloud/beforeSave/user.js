var Settings = require("cloud/utils/settings")

Parse.Cloud.beforeSave(Parse.User, function(req, res) {
  var user = req.object

  user.set("unsubscribe", !!user.get("unsubscribe"))

  if(!user.get("source")) user.set("source", "ios")
  if(!user.isNew()) return res.success()

  if(!user.get("questions")) user.set("questions", 0)
  if(!user.get("charges")) user.set("charges", 0)
  if(!user.get("payed")) user.set("payed", 0)
  if(!user.get("rating")) user.set("rating", 0)

  Settings().then(function(settings) {
    if(!user.get("freeQuestions")) user.set("freeQuestions", settings.get("freeQuestions"))
  }).then(function() {
    res.success()
  }, function(error) {
    res.error(error.message)
  })
})
