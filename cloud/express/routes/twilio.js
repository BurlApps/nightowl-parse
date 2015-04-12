var User = Parse.User
var Image = require("parse-image")
var Assignment = Parse.Object.extend("Assignment")
var Settings = require("cloud/utils/settings")

module.exports.auth = function(req, res, next) {
  Settings().then(function(settings) {
    req.settings = settings

    req.basicAuth(function(username, password) {
      var secret = settings.get("twilioSecret")
      return username == "twilio" && password == secret
    })(req, res, next)
  })
}

module.exports.user = function(req, res, next) {
  var query = new Parse.Query(User)
  var from = req.param("From")

  req.newUser = false
  req.user = null

  query.equalTo("phone", from)
  query.first().then(function(user) {
    if(user) return user

    user = new User()

    req.newUser = true
    user.set("username", from)
    user.set("password", from)
    user.set("phone", from)
    return user.signUp()
  }).then(function(user) {
    req.user = user
    next()
  })
}

module.exports.handler = function(req, res, next) {
  var numMedia = parseInt(req.param("NumMedia"))
  var mediaUrl = req.param("MediaUrl0")
  var mediaType = req.param("MediaContentType0")
  req.message = req.param("Body")

  if(numMedia == 0) {
    Settings().then(function(settings) {
      return Parse.Cloud.run("twilioMessage", {
        "To": settings.get("twilioSupport"),
        "Body": [
          "From: ", req.user.get("phone"), "\n",
          "Message: ", req.message
        ].join("")
      })
    }).then(function() {
      module.exports.render(req, res, "twilio/guide")
    })
  }

  Parse.Cloud.httpRequest({
		url: mediaUrl,
		method: "GET",
		followRedirects: true
	}).then(function(response) {
	  var image = new Image()
	  return image.setData(response.buffer)
	}).then(function(image) {
	  return image.data()
	}).then(function(buffer) {
		var extension = mediaType.split("/")[1]

	  var file = new Parse.File("image." + extension, {
			base64: buffer.toString("base64")
		})

	  return file.save()
	}).then(function(image) {
    req.media = image
		module.exports.newQuestion(req, res, next)
	})
}

module.exports.newQuestion = function(req, res, next) {
  var question = new Assignment()

  if(req.message && req.message.length != 0) {
    question.set("name", req.message)
  }

  question.set("creator", req.user)
  question.set("question", req.media)
  question.set("state", 1)

  question.save().then(function() {
    module.exports.render(req, res, "twilio/submitted")
  })
}

module.exports.render = function(req, res, template) {
  var price = req.settings.get("questionPrice")

  if(price < 1) {
    price = (price * 100) + "¢"
  } else {
    price = "$" + price
  }

  res.render(template, {
    newUser: req.newUser,
    price: price
  })
}
