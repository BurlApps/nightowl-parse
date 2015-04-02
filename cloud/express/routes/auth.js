var User = Parse.User
var Tutor = Parse.Object.extend("Tutor")

module.exports.auth = function(req, res, next) {
	if(req.session.user) {
		next();
	} else if(req.xhr) {
		res.json({
			success: false,
			message: "Login required :("
		})
	} else {
		res.redirect("/login")
	}
}

module.exports.login = function(req, res) {
  res.render('auth/login', {
	  template: 'auth/login'
  })
}

module.exports.register = function(req, res) {
  res.render('auth/register', {
	  template: 'auth/register'
  })
}

module.exports.welcome = function(req, res) {
  res.render('auth/welcome', {
	  template: 'auth/welcome'
  })
}

module.exports.loginUser = function(req, res) {
  Parse.User.logIn(req.param("email"), req.param("password"), {
	  success: function(user) {
		  if(user.get("tutor") && user.get("tutoring")) {
        req.session.user = user.id

        res.json({
			  	success: true,
			  	next: "/queue"
		  	})
		  } else {
			  res.json({
			  	success: false,
			  	message: "Invalid credentials :("
		  	})
		  }
	  },
	  error: function(user, error) {
		  console.log(error)

	    res.json({
		  	success: false,
		  	message: "Invalid credentials :("
	  	})
	  }
	})
}

module.exports.registerUser = function(req, res) {
  if(req.param("password") == req.param("password_confirm")) {
    var user = new User()
    var tutor = new Tutor()

    tutor.set("biography", req.param("biography"))
    tutor.save().then(function(tutor) {
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
      res.json({
		  	success: true,
		  	next: "/register/welcome"
	  	})
    }, function(error) {
      tutor.destroy()
		  console.log(error)

	    res.json({
		  	success: false,
		  	message: "Something Went Wrong :("
	  	})
	  })
  } else {
    res.json({
	  	success: false,
	  	message: "Passwords Don't Match :("
  	})
  }
}
