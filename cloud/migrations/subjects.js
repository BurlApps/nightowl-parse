var Subject = Parse.Object.extend("Subject")

Parse.Cloud.define("migrationSubjects", function(req, res) {
  Parse.Cloud.useMasterKey()

  var query = new Parse.Query(Subject)
  var subjects = [
    "Pre Algrebra", "Algebra", "Geometry",
    "Trigonometry", "Pre-Calculus", "Calculus",
    "Applied Calculus", "Vector Calculus"
  ]

  query.each(function(subject) {
    return subject.destroy()
  }).then(function() {
    subjects.forEach(function(name, index) {
      var subject = new Subject()

      subject.set("name", name)
      subject.set("rank", index)
      subject.save()
    })
  }).then(function() {
    res.success("Successfully added subjects")
  }, function(error) {
    res.error(error.description)
  })
})
