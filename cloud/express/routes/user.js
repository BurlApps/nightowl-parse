var User = Parse.User
var Stripe = require('stripe')
var Settings = require("cloud/utils/settings")

module.exports.card = function(req, res, next) {
  var query = new Parse.Query(User)

  query.equalTo("objectId", req.param("user"))
  query.count().then(function(count) {
    if(count == 1) {
      res.renderT('user/card', {
        notification: null,
        config: {
          user: req.param("user")
        }
      })
    } else {
      res.redirect("/")
    }
  })
}

module.exports.updated = function(req, res, next) {
  res.renderT('user/updated')
}
