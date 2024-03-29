var User = Parse.User
var Stripe = require('stripe')
var Settings = require("cloud/utils/settings")

module.exports.card = function(req, res, next) {
  var query = new Parse.Query(User)

  query.equalTo("objectId", req.param("user"))
  query.first().then(function(user) {
    if(user) {
      Parse.Analytics.track('userCard', {
        user: user.id
      }).then(function() {
        res.renderT('user/card', {
          config: {
            user: user.id
          },
          phone: user.get("phone")
        })
      })
    } else {
      res.redirect("/")
    }
  })
}

module.exports.updated = function(req, res, next) {
  res.renderT('user/updated')
}
