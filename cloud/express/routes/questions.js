var User = Parse.User
var Tutor = Parse.Object.extend("Tutor")
var Assignment = Parse.Object.extend("Assignment")
var Moment = require("moment")
var _ = require("underscore")

module.exports.home = function(req, res) {
  if(req.session.claimed) {
    res.redirect("/questions/" + req.session.claimed.objectId)
  } else {
    res.renderT("questions/index")
  }
}

module.exports.questions = function(req, res) {
  var query = new Parse.Query(Assignment)
  var questions = []
  var now = new Date()
  var user = new User()
  var tutor = new Tutor()

  user.id = req.session.user.objectId
  tutor.id = req.session.tutor.objectId

  query.doesNotExist("tutor")
  query.notContainedIn("state", [0, 2])

  tutor.fetch().then(function() {
    var subjectsQuery = tutor.relation("subjects").query()
    //query.matchesQuery("subject", subjectsQuery)

    return query.each(function(question) {
      var subject = _.find(req.session.subjects, function(element) {
        return element.objectId === question.get("subject").id
      })

      return questions.push({
        id: question.id,
        name: question.get("name"),
        image: question.get("question").url(),
        name: question.get("name"),
        created: question.createdAt,
        duration: Moment.duration(question.createdAt - now).humanize(true),
        subject: subject ? subject.name : "Other",
        paid: tutor.get("question")
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
