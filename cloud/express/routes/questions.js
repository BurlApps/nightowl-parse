var User = Parse.User
var Tutor = Parse.Object.extend("Tutor")
var Assignment = Parse.Object.extend("Assignment")
var Moment = require("moment")
var _ = require("underscore")
var Image = require("parse-image")

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
  var tutor = new Tutor()

  tutor.id = req.session.tutor.objectId

  query.containedIn("state", [1, 4, 5, 6])

  tutor.fetch().then(function() {
    var subjectsQuery = tutor.relation("subjects").query()

    // REENABLE WHEN DASHBOARD IS BUILT
    //query.matchesQuery("subject", subjectsQuery)

    return query.each(function(question) {
      var subject = null

      if(question.get("subject")) {
        subject = _.find(req.session.subjects, function(element) {
          return element.objectId === question.get("subject").id
        })
      }

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
  var question = new Assignment()

  question.id = req.param("question")

  if(question.id != req.session.claimed) {
    return res.redirect("/questions")
  }

  question.fetch().then(function() {
    return question.get("creator").fetch()
  }).then(function(user) {
    var subject = null

    if(!question.get("tutor") || question.get("tutor").id != req.session.tutor.objectId) {
      req.session.claimed = null;
      return res.redirect("/questions")
    }

    if(question.get("subject")) {
      subject = _.find(req.session.subjects, function(element) {
        return element.objectId === question.get("subject").id
      })
    }

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
        subject: subject ? subject.name : "Other",
        paid: paid,
        source: user.get("phone") || "App"
      },
      config: {
        question: question.id
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
    var currentTutor = question.get("tutor")

    if(currentTutor && currentTutor.id != tutor.id) {
      return Parse.Promise.error("Question already claimed")
    }

    question.set("tutor", tutor)
    question.set("state", 2)
    return question.save()
  }).then(function() {
    req.session.claimed = question.id
    res.redirect("/questions/" + question.id)
  }, function() {
    res.redirect("/questions/")
  })
}

module.exports.answered = function(req, res) {
  if(req.param("question") != req.session.claimed) {
    res.redirect("/questions")
  }

  var tutor = new Tutor()

  req.session.claimed = null
  tutor.id = req.session.tutor.objectId

  tutor.fetch().then(function() {
    var increment = tutor.get("question")
    var earned = tutor.get("earned")
    var owed = +(increment + earned).toFixed(2)

    tutor.set("earned", owed)
    return tutor.save()
  }).then(function() {
    req.session.tutor = tutor
    res.redirect("/questions")
  })
}

module.exports.flag = function(req, res) {
  var question = new Assignment()
  question.id = req.param("question")

  question.fetch().then(function() {
    var creator = question.get("creator")

    creator.increment("freeQuestions", 1)
    return creator.save()
  }).then(function(creator) {
    return Parse.Cloud.httpRequest({
  		url: req.host + "/images/flag.png"
  	})
  }).then(function(response) {
	  var image = new Image()
	  return image.setData(response.buffer)
	}).then(function(image) {
	  return image.data()
	}).then(function(buffer) {
	  var file = new Parse.File("image.png", {
			base64: buffer.toString("base64")
		})

	  return file.save()
	}).then(function(image) {
  	question.set("state", 3)
		question.set("answer", image)
		return question.save()
	}).then(function() {
    res.redirect("/questions/")
	}, function() {
    res.redirect("/questions/")
  })
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
    res.redirect("/questions/")
  }, function() {
    res.redirect("/questions/")
  })
}
