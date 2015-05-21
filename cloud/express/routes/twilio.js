var User = Parse.User
var Image = require("parse-image")
var Assignment = Parse.Object.extend("Assignment")
var Message = Parse.Object.extend("Message")
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

  req.user = null
  req.newUser = false

  query.equalTo("phone", from)
  query.first().then(function(user) {
    if(user) return user

    user = new User()
    req.newUser = true

    user.set("username", from)
    user.set("password", from)
    user.set("phone", from)
    user.set("source", "sms")
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

  if(numMedia == 0 || mediaType.split("/")[0] != "image") {
    if(req.message.toLowerCase().trim() == "unsubscribe") {
      req.user.set("unsubscribe", true)
      req.user.save().then(function() {
        module.exports.render(req, res, "twilio/unsubscribe")
      })
    } else {
      var message = new Message()

      message.set("user", req.user)
      message.set("type", 2)
      message.set("text", req.message)

      message.save().then(function() {
        var template = req.newUser ? "guide" : "empty"
        module.exports.render(req, res, "twilio/" + template)
      })
    }
  } else {
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
}

module.exports.newQuestion = function(req, res, next) {
  var question = new Assignment()
  var activateQuestion = !!req.user.get("card")

  if(req.message && req.message.length != 0) {
    question.set("name", req.message)
  }

  question.set("creator", req.user)
  question.set("question", req.media)
  question.set("state", activateQuestion ? 1 : 0)

  question.save().then(function() {
    if(req.user.get("freeQuestions") == 0) {
      var increment = req.settings.get("questionPrice")
      var earned = req.user.get("charges")
      var charges = +(increment + earned).toFixed(2)
      req.user.set("charges", charges)
    } else {
      req.user.increment("freeQuestions", -1)
    }

    return req.user.save()
  }).then(function() {
    var template = activateQuestion ? "submitted" : "card"
    module.exports.render(req, res, "twilio/" + template)
  })
}

module.exports.render = function(req, res, template) {
  var price = req.settings.get("questionPrice")

  if(price < 1) {
    price = (price * 100) + " cents"
  } else {
    price = "$" + price
  }

  res.render(template, {
    price: price,
    totalFreeQuestions: req.settings.get("freeQuestions"),
    freeQuestions: req.user.get("freeQuestions"),
    user: req.user
  })
}
