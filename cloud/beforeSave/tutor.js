var Settings = require("cloud/utils/settings")

Parse.Cloud.beforeSave("Tutor", function(req, res) {
  var tutor = req.object

  Settings().then(function(settings) {
    if(!tutor.get("rating")) tutor.set("rating", 0)
    if(!tutor.get("earned")) tutor.set("earned", 0)
    if(!tutor.get("paid")) tutor.set("paid", 0)

    if(!tutor.isNew()) return

    tutor.set("question", settings.get("tutorQuestion"))
    tutor.set("enabled", !!tutor.get("enabled"))
    tutor.set("email", !!tutor.get("email"))
  }).then(function() {
    res.success()
  }, function(error) {
    res.error(error.message)
  })
})
