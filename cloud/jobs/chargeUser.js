var Stripe = require('stripe');
var Settings = require("cloud/utils/settings")

Parse.Cloud.job("chargeUser", function(req, res) {
  Parse.Cloud.useMasterKey()

  Settings().then(function(settings) {
    return Stripe.initialize(settings.get("stripeKey"))
  }).then(function() {
    var query = new Parse.Query(Parse.User)

    query.greaterThan("charges", 0)
    query.exists("stripe")

    return query.each(function(user) {
      return Stripe.Charges.create({
        amount: user.get("charges"),
        currency: "usd",
        customer: user.get("stripe")
      }).then(function() {
        user.set("charges", 0)
        return user.save()
      })
    })
  }).then(function() {
    res.success("Charged users successfully")
  }, function(error) {
    res.error(error.description)
  })
})
