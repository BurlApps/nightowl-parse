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
  questions: require("cloud/express/routes/questions"),
  twilio: require("cloud/express/routes/twilio"),
  user: require("cloud/express/routes/user")
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
    httpOnly: true,
    maxAge: 600000
  },
  rolling: true
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
    data.tutor = data.tutor || req.session.tutor
    res.render(template, data)
  }

  // Auth
  req.basicAuth = express.basicAuth
  res.locals.csrf = req.session._csrf

  // Locals
  res.locals.host = req.protocol + "://" + req.host
  res.locals.url = res.locals.host + req.url
  res.locals.user = req.session.user
  res.locals.tutor = req.session.tutor
  res.locals.itunesApp = req.session.itunesApp || ""
  res.locals.parseId = req.session.parseId
  res.locals.parseSecret = req.session.parseSecret
  res.locals.stripeKey = req.session.stripeKey
  res.locals.random = random
  res.locals.config = {}

  if(req.session.appliedSettings !== true) {
    Settings().then(function(settings) {
	    req.session.appliedSettings = true
	    req.session.itunesApp = settings.get("itunesApp")
	    req.session.parseId = settings.get("parseId")
	    req.session.parseSecret = settings.get("parseSecret")
	    req.session.stripeKey = settings.get("stripePubKey")
      res.locals.itunesApp = req.session.itunesApp
      res.locals.parseId = req.session.parseId
      res.locals.parseSecret = req.session.parseSecret
      res.locals.stripeKey = req.session.stripeKey
      next()
    })
  } else {
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
app.get('/questions/:question', routes.auth.restricted, routes.questions.question)
app.get('/questions/:question/claim', routes.auth.restricted, routes.questions.claim)
app.get('/questions/:question/flag', routes.auth.restricted, routes.questions.flag)
app.get('/questions/:question/unclaim', routes.auth.restricted, routes.questions.unclaim)
app.get('/questions/:question/answered', routes.auth.restricted, routes.questions.answered)
app.post('/questions', routes.auth.restricted, routes.questions.questions)

// Twilio Texting
app.get('/twilio', routes.twilio.auth, routes.twilio.user, routes.twilio.handler)

// User
app.get('/user/updated', routes.user.updated)
app.get('/user/:user/card', routes.user.card)

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
