var User = Parse.User
var Rating = Parse.Object.extend("Rating")
var Tutor  = Parse.Object.extend("Tutor")

Parse.Cloud.define("migrationUserTutorRating", function(req, res) {
  Parse.Cloud.useMasterKey()

  var user = new User()
  var rating = new Rating()
  var tutor = new Tutor()
  var random = Math.random().toString(36).slice(2)

  user.set("username", random)
  user.set("password", random)
  user.set("rating", 0)


  user.signUp().then(function() {
    tutor.set("rating", 0)

    return tutor.save()
  }).then(function() {

    rating.set("rating", 0)
    rating.set("note", "hello world!")
    rating.set("user", user)
    rating.set("tutor", tutor)

    return rating.save()
  }).then(function() {
    var ratings = user.relation("ratings")
    ratings.add(rating)

    return user.save()
  }).then(function() {
    var ratings = tutor.relation("ratings")
    ratings.add(rating)

    return tutor.save()
  }).then(function() {
    return rating.destroy()
  }).then(function() {
    return tutor.destroy()
  }).then(function() {
    return user.destroy()
  }).then(function() {
    res.success("Successfully added user rating")
  }, function(error) {
    res.error(error.message)
  })
})
