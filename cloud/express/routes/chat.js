var User = Parse.User
var Message = Parse.Object.extend("Message")

module.exports.home = function(req, res) {
  res.renderT("chat/index")
}

module.exports.message = function(req, res) {
  var message = new Message()
  var user = new User()
  var messages = []

  user.id = req.param("user")

  message.set("user", user)
  message.set("type", 1)
  message.set("text", req.param("text"))

  message.save().then(function() {
    res.successT({
      message: message.id
    })
  }, res.errorT)
}

module.exports.messages = function(req, res) {
  var query = new Parse.Query(Message)
  var user = new User()
  var messages = []

  user.id = req.param("user")
  user.fetch().then(function() {
    query.equalTo("user", user)

    return query.each(function(message) {
      return messages.push({
        id: message.id,
        text: message.get("text"),
        user: {
          id: user.id,
          name: user.get("name") || user.get("phone")
        },
        type: message.get("type"),
        created: message.createdAt
      })
    })
  }).then(function() {
    res.successT({
      messages: messages.sort(function(a, b) {
        return a.created - b.created
      })
    })
  }, res.errorT)
}
