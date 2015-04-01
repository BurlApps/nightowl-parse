var Settings = require("cloud/utils/settings")

module.exports.home = function(req, res) {
  res.render('home/index', {
	  template: 'home/index'
  })
}

module.exports.notfound = function(req, res) {
  res.redirect("/")
}

module.exports.download = function(req, res) {
	Settings().then(function(settings) {
  	res.redirect(settings.get("itunesUrl"))
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
  res.render('sitemap')
}
