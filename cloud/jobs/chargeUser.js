var Stripe = require('stripe')
var Settings = require("cloud/utils/settings")

Parse.Cloud.job("chargeUser", function(req, res) {
  Parse.Cloud.useMasterKey()

  Settings().then(function(settings) {
    Stripe.initialize(settings.get("stripeKey"))

    var queryOne = new Parse.Query(Parse.User)
    var queryTwo = new Parse.Query(Parse.User)
    var monthAgo = new Date()

    monthAgo.setMonth(monthAgo.getMonth() - 1)

    queryOne.greaterThanOrEqualTo("charges", settings.get("bulkCharging"))
    queryTwo.lessThanOrEqualTo("updatedAt", monthAgo)

    var query = Parse.Query.or(queryOne, queryTwo)

    query.exists("stripe")
    query.exists("card")
    query.greaterThan("charges", 0)

    return query.each(function(user) {
      return Stripe.Charges.create({
        amount: user.get("charges") * 100,
        currency: "usd",
        customer: user.get("stripe"),
        statement_descriptor: "Night Owl"
      }).then(function() {
        user.set("payed", user.get("charges"))
        user.set("charges", 0)
        return user.save()
      }, function(error) {
        user.unset("card")
        return user.save()
      }).then(function () {
        var pushQuery = new Parse.Query(Parse.Installation)
        pushQuery.equalTo("user", user)
        
        return Parse.Push.send({
    	    where: pushQuery,
    	    data: {
            "sound": "alert.caf",
            "alert": "Thank you for your purchase(s)!"
          }
  	    })
      })
    })
  }).then(function() {
    res.success("Charged users successfully")
  }, function(error) {
    console.log(error)
    res.error(error.message)
  })
})
