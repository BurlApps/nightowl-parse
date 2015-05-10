var Settings = require("cloud/utils/settings")

module.exports.home = function(req, res) {
  Settings().then(function(settings) {
    res.renderT('home/index', {
      freeQuestions: settings.get("freeQuestions")
    })
  })
}

module.exports.phone = function(req, res) {
  Settings().then(function(settings) {
    var price = settings.get("questionPrice")

    Parse.Cloud.run("twilioMessage", {
      "To": req.param("phone"),
      "Body": [
        "Hey, I’m the friendly Night Owl bot! Send me math questions here or ",
        "on my iOS app (", req.session.host, "/d) and I'll solve them for you!"
      ].join("")
    }).then(function() {
      return Parse.Analytics.track('homeTwilio')
    }).then(function() {
      res.successT({
        message: "Sent!"
      })
    }, function() {
      res.errorT({
        message: "Invalid phone number :("
      })
    })
  })
}

module.exports.notfound = function(req, res) {
  res.redirect("/")
}

module.exports.download = function(req, res) {
	Settings().then(function(settings) {
  	res.redirect(settings.get("itunesLink"))
  })
}

module.exports.terms = function(req, res) {
  Settings().then(function(settings) {
  	res.redirect(settings.get("termsUrl"))
  })
}

module.exports.privacy = function(req, res) {
  Settings().then(function(settings) {
  	res.redirect(settings.get("privacyUrl"))
  })
}

module.exports.robots = function(req, res) {
  res.set('Content-Type', 'text/plain')
  res.render('seo/robots')
}

module.exports.sitemap = function(req, res) {
  res.set('Content-Type', 'application/xml')
  res.render('seo/sitemap')
}
