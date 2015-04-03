var User = Parse.User
var Tutor = Parse.Object.extend("Tutor")
var Subject = Parse.Object.extend("Subject")

module.exports.restricted = function(req, res, next) {
	if(req.session.user) {
		next();
	} else if(req.xhr) {
		res.errorT("Login required :(")
	} else {
		res.redirect("/login")
	}
}

module.exports.login = function(req, res) {
  res.renderT('auth/login')
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

module.exports.loginUser = function(req, res) {
  Parse.User.logIn(req.param("email"), req.param("password"), {
	  success: function(user) {
		  if(user.get("tutor") && user.get("tutoring")) {
  		  req.session.user = user
  		  req.session.subjects = []
        var query = new Parse.Query(Subject)

        query.ascending("rank")
        query.find(function(subjects) {
          req.session.subjects = subjects
        }).then(function() {
          res.successT({
  			  	next: "/questions"
  		  	})
        }, res.errorT)
		  } else {
			  res.errorT("Invalid credentials :(")
		  }
	  },
	  error: function(user, error) {
      res.errorT("Invalid credentials :(")
	  }
	})
}

module.exports.registerUser = function(req, res) {
  if(req.param("password") == req.param("password_confirm")) {
    var user = new User()
    var tutor = new Tutor()

    tutor.set("biography", req.param("biography"))
    tutor.save().then(function(tutor) {
      user.set("name", req.param("name"))
      user.set("email", req.param("email"))
      user.set("username", req.param("email"))
      user.set("password", req.param("password"))
      user.set("tutor", tutor)
      user.set("tutoring", false)

      return user.save().then(function() {
        tutor.set("user", user)
        return tutor.save()
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
