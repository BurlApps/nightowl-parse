var Stripe = require('stripe')
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
    console.error(error)
    res.error(error.message)
  })
})

Parse.Cloud.define("addCard", function(req, res) {
  Parse.Cloud.useMasterKey()
  var user

  if(req.params.user) {
    user = new Parse.User()
    user.id = req.params.user
  } else {
    user = Parse.User.current()
  }

  Settings().then(function(settings) {
    return Stripe.initialize(settings.get("stripeKey"))
  }).then(function() {
    return user.fetch()
  }).then(function() {
    if(req.params.lastFour) {
      user.set("card", req.params.lastFour)
      return user.save()
    }

    return true
  }).then(function() {
    if(user.get("stripe")) return true

    return Stripe.Customers.create({
      description: 'User ID: ' + user.id
    }).then(function(data) {
      user.set("stripe", data.id)
      return user.save()
    })
  }).then(function() {
    return Stripe.Customers.update(user.get("stripe"), {
      card: req.params.card
    })
  }).then(function() {
    res.success("Successfully added card to user")
  }, function(error) {
    console.error(error)
    res.error(error.message)
  })
})
