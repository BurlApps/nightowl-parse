var Settings = require("cloud/utils/settings")

Parse.Cloud.beforeSave("Tutor", function(req, res) {
  var tutor = req.object

  Settings().then(function(settings) {
    if(!tutor.isNew()) return

    tutor.set("earned", 0)
    tutor.set("paid", 0)
    tutor.set("question", settings.get("tutorQuestion"))
    tutor.set("enabled", !!user.get("enabled"))
    tutor.set("email", !!user.get("email"))
  }).then(function() {
    res.success()
  }, function(error) {
    res.error(error.message)
  })
})
