var User = Parse.User
var Tutor = Parse.Object.extend("Tutor")
var Assignment = Parse.Object.extend("Assignment")
var Moment = require("moment")

module.exports.home = function(req, res) {
  res.renderT("questions/index")
}

module.exports.questions = function(req, res) {
  var query = new Parse.Query(Assignment)
  var questions = []
  var now = new Date()
  var user = new User()
  var tutor = new Tutor()

  user.id = req.session.user.objectId
  tutor.id = req.session.user.tutor.objectId

  query.doesNotExist("tutor")
  query.containedIn("state", [1,4,5,6])

  tutor.fetch().then(function() {
    var subjectsQuery = tutor.relation("subjects").query()
    query.matchesQuery("subject", subjectsQuery)

    return query.each(function(question) {
      return questions.push({
        id: question.id,
        image: question.get("image").url(),
        name: question.get("name"),
        created: question.createdAt,
        duration: Moment.duration(question.createdAt - now).humanize(true),
        subject: function() {
          for(var subject in req.session.subjects) {
            if(subject.objectId == question.get("subject").id) {
              return subject.name
            }
          }
        }()
      })
    })
  }).then(function() {
    res.successT({
      questions: questions.sort(function(a, b) {
        return a.created - b.created
      })
    })
  }, function(error) {
    console.log(error)
    res.errorT({
      questions: []
    })
  })
}
