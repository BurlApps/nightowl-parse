var User = Parse.User

Parse.Cloud.job("feedbackSMS", function(req, res) {
  Parse.Cloud.useMasterKey()

  var query = new Parse.Query(User)

  query.exists("phone")
  query.notEqualTo("unsubscribe", true)

  return query.each(function(user) {
    return Parse.Cloud.run("twilioMessage", {
      "Body": [
        "Hey it's Brian from Night Owl, the math tutoring service. ",
        "Thanks for trying us out, if you have any suggestions to ",
        "help us improve we would be happy to hear it!"
      ].join(""),
      "To": user.get("phone")
    })
  }).then(function() {
    res.success("Asked for feedback successful")
  }, function(error) {
    console.log(error)
    res.error(error.message)
  })
})
