var Settings = require("cloud/utils/settings")

Parse.Cloud.define("twilioMessage", function(req, res) {
  Settings().then(function(settings) {
    var url = [
      "https://", settings.get("twilioId"),
      ":", settings.get("twilioToken"),
      "@api.twilio.com/2010-04-01/Accounts/",
      settings.get("twilioId"), "/Messages.json"
    ].join("")

    req.params["From"] = settings.get("twilioNumber")

    return Parse.Cloud.httpRequest({
      url: url,
      method: "POST",
      followRedirects: true,
      body: req.params
    })
  }).then(function(response) {
    res.success("Successfully sent message to user")
  }, function(error) {
    console.error(error)
    res.error(error.message)
  })
})
