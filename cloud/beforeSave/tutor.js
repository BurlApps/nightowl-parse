Parse.Cloud.beforeSave("Tutor", function(req, res) {
  var tutor = req.object

  tutor.set("earned", 0)
  tutor.set("paid", 0)

  res.success()
})
