var User = Parse.User
var Promo = Parse.Object.extend("Promo")

Parse.Cloud.define("migrationPromo", function(req, res) {
  Parse.Cloud.useMasterKey()

  var user = new User()
  var promo = new Promo()
  var random = Math.random().toString(36).slice(2)

  user.set("username", random)
  user.set("password", random)

  user.signUp().then(function() {
    var users = promo.relation("users")

    promo.set("name", "Test Name")
    promo.set("code", "Code")
    promo.set("credits", 3)
    promo.set("enabled", true)

    users.add(user)

    return promo.save()
  }).then(function() {
    return user.destroy()
  }).then(function() {
    return promo.destroy()
    res.success("Successfully added promo class")
  }, function(error) {
    console.log(error)
    res.error(error.message)
  })
})
