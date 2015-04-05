var Subject = Parse.Object.extend("Subject")

Parse.Cloud.define("migrationSubjects", function(req, res) {
  Parse.Cloud.useMasterKey()

  var query = new Parse.Query(Subject)
  var subjects = {
    "Pre Algrebra": 0, "Algebra": 1, "Geometry": 2,
    "Trigonometry": 2, "Pre-Calculus": 3, "Calculus": 4,
    "Applied Calculus": 5, "Vector Calculus": 6
  }

  query.containedIn("name", Object.keys(subjects))
  query.each(function(subject) {
    var name = subject.get("name")
    if(name in subjects) delete subjects[name]
  }).then(function() {
    for(var name in subjects) {
      var subject = new Subject()

      subject.set("name", name)
      subject.set("rank", subjects[name])
      subject.save()
    }
  }).then(function() {
    res.success("Successfully added subjects")
  }, function(error) {
    res.error(error.description)
  })
})
