var Settings = require("cloud/utils/settings")
var express = require('express')
var app = express()
var random = Math.random().toString(36).slice(2)

// Set Master Key
Parse.Cloud.useMasterKey()

// Routes
var routes = {
  core: require("cloud/express/routes/index")
}

// Global app configuration section
app.set('views', 'cloud/express/views')
app.set('view engine', 'ejs')

app.enable('trust proxy')

app.use(express.bodyParser())
app.use(express.cookieParser())
app.use(express.cookieSession({
  secret: 'ursid',
  cookie: {
    httpOnly: true
  }
}))
app.use(express.csrf())
app.use(function(req, res, next) {
  // Auth
  req.basicAuth = express.basicAuth
  res.locals.csrf = req.session._csrf

  // Locals
  res.locals.host = req.protocol + "://" + req.host
  res.locals.url = res.locals.host + req.url
  res.locals.admin = !!req.session.admin
  res.locals.user = !!req.session.user
  res.locals.random = random

  if(req.session.appliedSettings !== true) {
    Settings().then(function(settings) {
	    req.session.appliedSettings = true
	    req.session.enforceSSL = settings.get("enforceSSL")
	    req.session.production = settings.get("production")
	    req.session.itunesApp = settings.get("itunesApp")
      res.locals.itunesApp = req.session.itunesApp
      next()
    })
  } else {
    res.locals.itunesApp = req.session.itunesApp || ""
     next()
  }
})

console.log(routes.core.home)

// Landing
app.get('/', routes.core.home)

// Terms
app.get('/terms', routes.core.terms)

// Privacy
app.get('/privacy', routes.core.privacy)

// Robots
app.get('/robots', routes.core.robots)
app.get('/robots.txt', routes.core.robots)

// Sitemap
app.get('/sitemap', routes.core.sitemap)
app.get('/sitemap.xml', routes.core.sitemap)

// Not Found Redirect
app.all("*", routes.core.notfound)

// Listen to Parse
app.listen()
