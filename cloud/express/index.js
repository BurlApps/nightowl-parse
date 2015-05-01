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
  user: require("cloud/express/routes/user"),
  chat: require("cloud/express/routes/chat")
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
    maxAge: 604800000,
    proxy: true
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
    console.error(error)
    error = error.description || error.message || "An error occurred"

    res.json({
      success: false,
      status: 1,
      message: error
    })
  }

  // Render Shorcut
  res.renderT = function(template, data) {
    // Tracking
    Parse.Analytics.track('pageView', {
      link: req.url,
      method: req.route.method
    })

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
  res.locals.host = req.session.host || ("http://" + req.host)
  res.locals.url = res.locals.host + req.url
  res.locals.user = req.session.user
  res.locals.tutor = req.session.tutor
  res.locals.itunesApp = req.session.itunesApp || ""
  res.locals.parseId = req.session.parseId
  res.locals.parseSecret = req.session.parseSecret
  res.locals.stripeKey = req.session.stripeKey
  res.locals.pusherKey = req.session.pusherKey
  res.locals.account = req.session.account
  res.locals.random = random
  res.locals.config = {}

  if(req.session.appliedSettings !== true) {
    Settings().then(function(settings) {
	    req.session.appliedSettings = true
	    req.session.itunesApp = settings.get("itunesId")
	    req.session.parseId = settings.get("parseId")
	    req.session.pusherKey = settings.get("pusherKey")
	    req.session.parseSecret = settings.get("parseSecret")
	    req.session.stripeKey = settings.get("stripePubKey")
	    req.session.account = settings.get("account")
	    req.session.host = settings.get("host")
	    res.locals.host = req.session.host
      res.locals.itunesApp = req.session.itunesApp
      res.locals.parseId = req.session.parseId
      res.locals.parseSecret = req.session.parseSecret
      res.locals.stripeKey = req.session.stripeKey
      res.locals.pusherKey = req.session.pusherKey
      res.locals.account = req.session.account
      next()
    })
  } else {
    next()
  }
})

// Landing
app.get('/', routes.core.home)
app.post('/phone', routes.core.phone)

// Download
app.get('/d', routes.core.download)
app.get('/r', routes.core.download)
app.get('/download', routes.core.download)
app.get('/rate', routes.core.download)

// Auth
app.get('/login', routes.auth.login)
app.get('/logout', routes.auth.logout)
app.get('/register', routes.auth.register)
app.get('/register/welcome', routes.auth.welcome)
app.post('/login', routes.auth.loginUser)
app.post('/register', routes.auth.registerUser)

// Support Chat
app.get('/chat', routes.auth.restricted, routes.chat.home)
app.get('/chat/rooms', routes.auth.restricted, routes.chat.rooms)
app.get('/chat/:user', routes.auth.restricted, routes.chat.home)
app.get('/chat/:user/room', routes.auth.restricted, routes.chat.room)
app.get('/chat/:user/messages', routes.auth.restricted, routes.chat.messages)
app.post('/chat/:user/read', routes.auth.restricted, routes.chat.read)
app.post('/chat/:user/message', routes.auth.restricted, routes.chat.message)

// Queue
app.get('/questions', routes.auth.restricted, routes.questions.home)
app.get('/questions/:question', routes.auth.restricted, routes.questions.question)
app.get('/questions/:question/peek', routes.auth.restricted, routes.questions.peek)
app.get('/questions/:question/claim', routes.auth.restricted, routes.questions.claim)
app.get('/questions/:question/flag/:state', routes.auth.restricted, routes.questions.flag)
app.get('/questions/:question/delete', routes.auth.restricted, routes.questions.delete)
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
