var Promo = Parse.Object.extend("Promo")
var Settings = require("cloud/utils/settings")

module.exports.home = function(req, res) {
  var query = new Parse.Query(Promo)

  query.equalTo("enabled", true)
  query.equalTo("slug", req.param("ref"))

  query.first(function(promo) {
    res.renderT('home/index', {
      promo: promo
    })
  })
}

module.exports.phone = function(req, res) {
  Settings().then(function(settings) {
    var price = settings.get("questionPrice")

    Parse.Cloud.run("twilioMessage", {
      "To": req.param("phone"),
      "Body": [
        "Welcome to Night Owl! Download the iOS app: ",
        req.session.host, "/d or simply reply back with ",
        "your name to get started!"
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

module.exports.onboard = function(req, res) {
  Settings().then(function(settings) {
  	res.redirect(settings.get("onboardUrl"))
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
