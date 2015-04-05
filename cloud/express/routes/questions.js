var User = Parse.User
var Tutor = Parse.Object.extend("Tutor")
var Assignment = Parse.Object.extend("Assignment")
var Moment = require("moment")
var _ = require("underscore")

module.exports.home = function(req, res) {
  if(req.session.claimed) {
    res.redirect("/questions/" + req.session.claimed)
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
  query.notContainedIn("state", [0, 2, 3])

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

module.exports.question = function(req, res) {
  var now = new Date()
  var question = new Assignment()

  question.id = req.param("question")

  if(question.id != req.session.claimed) {
    res.redirect("/questions")
  }

  question.fetch().then(function() {
    var subject = _.find(req.session.subjects, function(element) {
      return element.objectId === question.get("subject").id
    })

    var name = question.get("name")
    var paid = req.session.tutor.question

    if(paid < 1) {
      paid = (paid * 100) + "¢"
    } else {
      paid = "$" + paid
    }

    res.renderT("questions/question", {
      question: {
        id: question.id,
        description: name || "No Description Provided",
        image: question.get("question").url(),
        name: question.get("name"),
        duration: Moment.duration(question.createdAt - now).humanize(true),
        subject: subject ? subject.name : "Other",
        paid: paid
      }
    })
  })
}

module.exports.claim = function(req, res) {
  var tutor = new Tutor()
  var question = new Assignment()

  question.id = req.param("question")
  tutor.id = req.session.tutor.objectId

  question.fetch().then(function() {
    question.set("tutor", tutor)
    question.set("state", 2)
    return question.save()
  }).then(function() {
    req.session.claimed = question.id
    Parse.Cloud.run("assignmentPush", { question: question.id })
    res.redirect("/questions/" + question.id)
  }, function() {
    res.redirect("/questions/")
  })
}

module.exports.flag = function(req, res) {
  res.redirect("/questions")
}

module.exports.unclaim = function(req, res) {
  var question = new Assignment()
  question.id = req.param("question")

  if(question.id != req.session.claimed) {
    res.redirect("/questions")
  }

  question.fetch().then(function() {
    question.unset("tutor")
    question.set("state", 1)
    return question.save()
  }).then(function() {
    req.session.claimed = null
    Parse.Cloud.run("assignmentPush", { question: question.id })
    res.redirect("/questions/")
  }, function() {
    res.redirect("/questions/")
  })
}
