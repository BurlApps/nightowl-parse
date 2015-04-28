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

    if(price < 1) {
      price = (price * 100) + " cents"
    } else {
      price = "$" + price
    }

    Parse.Cloud.run("twilioMessage", {
      "To": req.param("phone"),
      "Body": [
        "Hey, I’m the Night Owl bot! Send a photo of a math question ",
        "and our grad students will solve the first ",
        settings.get("freeQuestions"), " for free, then it’s only ",
        price, " 😃"
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
