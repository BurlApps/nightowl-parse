var Settings = require("cloud/utils/settings")
var express = require('express')
var app = express()
var random = Math.random().toString(36).slice(2)

// Set Master Key
Parse.Cloud.useMasterKey()

// Routes
var routes = {
  core: require("cloud/express/routes/index"),
  auth: require("cloud/express/routes/auth"),
  questions: require("cloud/express/routes/questions")
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
  // Success Shorcut
  res.successT = function(data) {
    data = data || {}
    data.success = true
    res.json(data)
  }

  // Error Shorcut
  res.errorT = function(error) {
    console.log(error)
    error = error.description || error

    res.json({
      success: false,
      status: 1,
      message: error
    })
  }

  // Render Shorcut
  res.renderT = function(template, data) {
    data = data || {}
    data.template = data.template || template
    data.user = data.user || req.session.user
    res.render(template, data)
  }

  // Auth
  req.basicAuth = express.basicAuth
  res.locals.csrf = req.session._csrf

  // Locals
  res.locals.host = req.protocol + "://" + req.host
  res.locals.url = res.locals.host + req.url
  res.locals.user = req.session.user
  res.locals.random = random

  if(req.session.appliedSettings !== true) {
    Settings().then(function(settings) {
	    req.session.appliedSettings = true
	    req.session.itunesApp = settings.get("itunesApp")
      res.locals.itunesApp = req.session.itunesApp
      next()
    })
  } else {
    res.locals.itunesApp = req.session.itunesApp || ""
     next()
  }
})

// Landing
app.get('/', routes.core.home)

// Auth
app.get('/login', routes.auth.login)
app.get('/logout', routes.auth.logout)
app.get('/register', routes.auth.register)
app.get('/register/welcome', routes.auth.welcome)
app.post('/login', routes.auth.loginUser)
app.post('/register', routes.auth.registerUser)

// Queue
app.get('/questions', routes.auth.restricted, routes.questions.home)
app.post('/questions', routes.auth.restricted, routes.questions.questions)

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
