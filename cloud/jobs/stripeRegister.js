var User = Parse.User

Parse.Cloud.job("stripeRegister", function(req, res) {
  Parse.Cloud.useMasterKey()

  var query = new Parse.Query(User)

  query.doesNotExist("stripe")

  return query.each(function(user) {
    return Parse.Cloud.run("stripeRegister", {
      user: user.id
    })
  }).then(function() {
    res.success("Stripe register successful")
  }, function(error) {
    console.log(error)
    res.error(error.message)
  })
})
