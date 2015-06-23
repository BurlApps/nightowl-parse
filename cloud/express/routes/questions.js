var User = Parse.User
var Tutor = Parse.Object.extend("Tutor")
var Assignment = Parse.Object.extend("Assignment")
var Moment = require("moment")
var _ = require("underscore")
var Image = require("parse-image")

module.exports.home = function(req, res) {
  res.renderT("questions/index")
}

module.exports.questions = function(req, res) {
  var query = new Parse.Query(Assignment)
  var questions = []
  var now = new Date()
  var tutor = new Tutor()

  tutor.id = req.session.tutor.objectId

  query.containedIn("state", [1, 4, 5, 6])

  console.log(req.session.tutor)

  tutor.fetch().then(function() {
    // REENABLE WHEN DASHBOARD IS BUILT
    //var subjectsQuery = tutor.relation("subjects").query()
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
        created: question.createdAt,
        duration: Moment.duration(question.createdAt - now).humanize(true),
        subject: subject ? subject.name : "Other",
        paid: tutor.get("question"),
        user: question.get("creator").id
      })
    })
  }).then(function() {
    res.successT({
      questions: questions.sort(function(a, b) {
        return a.created - b.created
      })
    })
  }, function(error) {
    console.error(error)
    res.errorT({
      questions: []
    })
  })
}

module.exports.question = function(req, res) {
  var question = new Assignment()

  question.id = req.param("question")

  question.fetch().then(function() {
    return question.get("creator").fetch()
  }).then(function(user) {
    var subject = null

    if(!question.get("tutor") || question.get("tutor").id != req.session.tutor.objectId) {
      return res.redirect("/questions")
    }

    if(question.get("subject")) {
      subject = _.find(req.session.subjects, function(element) {
        return element.objectId === question.get("subject").id
      })
    }

    var name = question.get("name")
    var answer = question.get("answer")
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
        answer: (answer) ? answer.url() : null,
        name: question.get("name"),
        subject: subject ? subject.name : "Other",
        paid: paid,
        source: user.get("phone") || user.id,
        user: user.id
      },
      config: {
        question: question.id
      }
    })
  }, function(error) {
    console.error(error)
    res.redirect("/questions")
  })
}

module.exports.peek = function(req, res) {
  var question = new Assignment()

  question.id = req.param("question")

  question.fetch().then(function() {
    return question.get("creator").fetch()
  }).then(function(user) {
    req.user = user

    if(question.get("tutor")) {
      return question.get("tutor").fetch()
    } else {
      return null
    }
  }).then(function(tutor) {
    if(tutor) {
      return tutor.get("user").fetch()
    } else {
      return null
    }
  }).then(function(tutor) {
    var subject = null

    if(!question.get("tutor")) {
      return res.redirect("/questions")
    }

    if(question.get("tutor").id == req.session.tutor.objectId) {
      return res.redirect("/questions/" + question.id)
    }

    if(question.get("subject")) {
      subject = _.find(req.session.subjects, function(element) {
        return element.objectId === question.get("subject").id
      })
    }

    var name = question.get("name")
    var answer = question.get("answer")
    var state = "Uploading"

    switch(question.get("state")) {
      case 1: state = "Unclaimed"; break;
      case 2: state = "Claimed"; break;
      case 3: state = "Completed"; break;
      case 4:
      case 5:
      case 6: state = "Flagged (User)"; break;
      case 7:
      case 8: state = "Flagged (Tutor)"; break;
      case 9: state = "Deleted"; break;
    }

    res.renderT("questions/peek", {
      question: {
        id: question.id,
        description: name || "No Description Provided",
        question: question.get("question").url(),
        answer: (answer) ? answer.url() : "",
        name: question.get("name"),
        subject: subject ? subject.name : "Other",
        source: req.user.get("phone") || req.user.id,
        tutor: tutor.get("name"),
        state: state,
        user: req.user.id
      },
      config: {
        question: question.id
      }
    })
  }, function(error) {
    console.error(error)
    res.redirect("/questions")
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
    res.redirect("/questions/" + question.id)
  }, function(error) {
    console.error(error)
    res.redirect("/questions")
  })
}

module.exports.answered = function(req, res) {
  var tutor = new Tutor()

  tutor.id = req.session.tutor.objectId

  tutor.fetch().then(function() {
    var increment = tutor.get("question")
    var earned = tutor.get("earned")
    var owed = +(increment + earned).toFixed(2)

    tutor.set("earned", owed)
    return tutor.save()
  }).then(function() {
	  req.session.tutor = {
		  objectId: tutor.id,
      enabled: tutor.get("enabled"),
      earned: tutor.get("earned"),
      paid: tutor.get("paid"),
      question: tutor.get("question")
	  }

    res.redirect("/questions")
  }, function(error) {
    console.error(error)
    res.redirect("/questions")
  })
}

module.exports.delete = function(req, res) {
  var tutor = new Tutor()
  var question = new Assignment()

  question.id = req.param("question")
  tutor.id = req.session.tutor.objectId

  question.set("state", 9)
  question.set("tutor", tutor)

  question.save().then(function() {
    res.redirect("/questions")
  }, function(error) {
    console.error(error)
    res.redirect("/questions")
  })
}

module.exports.flag = function(req, res) {
  var tutor = new Tutor()
  var question = new Assignment()
  var state = parseInt(req.param("state"))

  if([7, 8].indexOf(state) == -1) {
    return res.redirect("/questions")
  }

  question.id = req.param("question")
  tutor.id = req.session.tutor.objectId

  question.fetch().then(function() {
    var creator = question.get("creator")

    creator.increment("freeQuestions", 1)
    return creator.save()
  }).then(function(creator) {
    return Parse.Cloud.httpRequest({
  		url: req.host + "/images/flagged/" + state + ".png"
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
  	question.set("state", state)
		question.set("answer", image)
		question.set("tutor", tutor)
		return question.save()
	}).then(function() {
    res.redirect("/questions")
	}, function(error) {
  	console.error(error)
    res.redirect("/questions")
  })
}

module.exports.unclaim = function(req, res) {
  var question = new Assignment()
  question.id = req.param("question")

  question.unset("tutor")
  question.set("state", 1)

  question.save().then(function() {
    res.redirect("/questions")
  }, function(error) {
    console.error(error)
    res.redirect("/questions")
  })
}
