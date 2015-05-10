var User = Parse.User

Parse.Cloud.define("migrationUserSource", function(req, res) {
  Parse.Cloud.useMasterKey()

  var query = new Parse.Query(User)

  query.doesNotExist("source")

  query.each(function(user) {
    if(user.get("phone")) {
      user.set("source", "sms")
    } else {
      user.set("source", "ios")
    }

    return user.save()
  }).then(function() {
    res.success("Successfully added user source")
  }, function(error) {
    res.error(error.message)
  })
})
