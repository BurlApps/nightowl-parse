var User = Parse.User
var Tutor = Parse.Object.extend("Tutor")
var Subject = Parse.Object.extend("Subject")

module.exports.restricted = function(req, res, next) {
	if(req.session.user && req.session.tutor.enabled) {
		next();
	} else if(req.xhr) {
		res.errorT("Login required :(")
	} else {
  	req.session = null
		res.redirect("/login?next=" + req.url)
	}
}

module.exports.login = function(req, res) {
  res.renderT('auth/login', {
    next: req.param("next")
  })
}

module.exports.logout = function(req, res) {
  req.session = null
  res.redirect("/")
}

module.exports.register = function(req, res) {
  res.renderT('auth/register')
}

module.exports.welcome = function(req, res) {
  res.renderT('auth/welcome')
}

module.exports.loginTutor = function(req, res) {
  Parse.User.logIn(req.param("email"), req.param("password"), {
	  success: function(user) {
  	  if(!user || !user.get("tutor")) {
    	  return res.errorT("Invalid credentials :(")
  	  }

  	  user.get("tutor").fetch(function(tutor) {
  		  if(!tutor.get("enabled")) {
    		  return res.errorT("Invalid credentials :(")
  		  }

  		  req.session.user = user
  		  req.session.tutor = tutor
  		  req.session.subjects = []

  		  return tutor
  		}).then(function() {
        var query = new Parse.Query(Subject)

        return query.find(function(subjects) {
          req.session.subjects = subjects
        })
		  }).then(function() {
  		  res.successT({
			  	next: req.param("next") || "/questions"
		  	})
		  }, res.errorT)
	  },
	  error: function(user, error) {
      res.errorT("Invalid credentials :(")
	  }
	})
}

module.exports.registerTutor = function(req, res) {
  if(req.param("password") == req.param("password_confirm")) {
    var user = new User()
    var tutor = new Tutor()

    tutor.set("enabled", false)
    tutor.set("email", false)
    tutor.set("biography", req.param("biography"))

    tutor.save().then(function(tutor) {
      user.set("name", req.param("name"))
      user.set("email", req.param("email"))
      user.set("username", req.param("email"))
      user.set("password", req.param("password"))
      user.set("tutor", tutor)

      return user.save().then(function() {
        tutor.set("user", user)
        return tutor.save()
      })
    }).then(function() {
      return Parse.Cloud.run("newTutorSlack", {
        tutor: tutor.id
      })
    }).then(function() {
      res.successT({
		  	next: "/register/welcome"
	  	})
    }, function(error) {
      tutor.destroy()
		  console.log(error)

	    res.errorT("Something Went Wrong :(")
	  })
  } else {
    res.errorT("Passwords Don't Match :(")
  }
}

module.exports.activateTutor = function(req, res) {
  var tutor = new Tutor()

  tutor.id = req.param("tutor")

  tutor.fetch().then(function() {
    if(tutor.get("enabled")) {
      return false
    }

    tutor.set("enabled", true)
    return tutor.save()
  }).then(function(data) {
    if(data === false) return

    return Parse.Cloud.run("createTutorSlack", {
      tutor: tutor.id
    })
  }).then(function() {
    res.renderT("auth/activated")
  }, function(error) {
	  console.log(error)
    res.errorT("Something Went Wrong :(")
  })
}
