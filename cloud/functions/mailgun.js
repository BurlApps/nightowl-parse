var Mailgun = require('mailgun')
var Tutor = Parse.Object.extend("Tutor")
var Assignment = Parse.Object.extend("Assignment")
var Settings = require('cloud/utils/settings')

Parse.Cloud.define("notifyNewTutor", function (req, res) {
  Parse.Cloud.useMasterKey()
  var tutor = new Tutor()
  
  tutor.id = req.params.tutor
  
  Settings().then(function(settings) {
    req.settings = settings
    Mailgun.initialize(settings.get("mailgunDomain"), settings.get('mailgunKey'))
    return tutor.fetch()
  }).then(function () {
    return tutor.get("user").fetch()
  }).then(function(user) {
    return Mailgun.sendEmail({
      to: user.get("email"),
      from: "Night Owl <noreply@heynightowl.com>",
      subject: "[Night Owl: "+req.settings.get("account") + " ] You have been approved as a tutor!",
      text: ["Congratulations, you've been accepted as a tutor at Night Owl!\n\n",
             "Keep an eye out for a Slack invitation and check out the question queue here:\n\n",
             req.settings.get("host"),"/login"
      ].join("")
    })
  }).then(function(data) {
    res.success("Notified New Tutor")
  }, function(error) {
    console.error(error)
    res.error(error.message)
  })
})



// DEPRECATED: We have moved to Slack notifications
Parse.Cloud.define("notifyTutors", function(req, res) {
  
  return res.error("Module has been deprecated!")
  
  Parse.Cloud.useMasterKey()

  Settings().then(function(settings) {
    req.settings = settings
    return Mailgun.initialize(settings.get("mailgunDomain"), settings.get('mailgunKey'))
  }).then(function() {
    var query = new Parse.Query(Assignment)

    query.equalTo("state", 1)
    return query.count()
  }).then(function(count) {
    var query = new Parse.Query(Tutor)

    query.equalTo("email", true)
    query.equalTo("enabled", true)

    return query.each(function(tutor) {
      return tutor.get("user").fetch(function(user) {
        return Mailgun.sendEmail({
          to: user.get("email"),
          from: "Night Owl <questions@heynightowl.com>",
          subject: "[Night Owl: " + req.settings.get("account") + "] A Question Has Been Posted!",
          text: [
            "One of our users has posted a new question! There are a total of ",
            count, " waiting to be claimed. \n\nStart answering questions: ",
            req.settings.get("host"), "/questions"
          ].join("")
        })
      })
    })
  }).then(function(data) {
    res.success("Notified Tutors")
  }, function(error) {
    console.error(error)
    res.error(error.message)
  })
})
