var Stripe = require('stripe');
var Settings = require("cloud/utils/settings")

Parse.Cloud.define("stripeRegister", function(req, res) {
  Parse.Cloud.useMasterKey()

  var user = new Parse.User()
  user.id = req.params.user

  Settings().then(function(settings) {
    return Stripe.initialize(settings.get("stripeKey"))
  }).then(function() {
    return Stripe.Customers.create({
      description: 'User ID: ' + user.id
    })
  }).then(function(data) {
    user.set("stripe", data.id)
    return user.save()
  }).then(function() {
    res.success("Successfully added card to user")
  }, function(error) {
    res.error(error.description)
  })
})

Parse.Cloud.define("addCard", function(req, res) {
  Parse.Cloud.useMasterKey()

  var user = Parse.User.current()

  Settings().then(function(settings) {
    return Stripe.initialize(settings.get("stripeKey"))
  }).then(function() {
    return Stripe.Customers.update(user.get("stripe"), {
      card: req.params.card
    })
  }).then(function() {
    res.success("Successfully added card to user")
  }, function(error) {
    res.error(error.message)
  })
})
