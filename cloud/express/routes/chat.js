var User = Parse.User
var Message = Parse.Object.extend("Message")
var Conversation = Parse.Object.extend("Conversation")
var Moment = require("moment")

module.exports.home = function(req, res) {
  res.renderT("chat/index", {
    config: {
      room: req.param("user") || null
    }
  })
}

module.exports.room = function(req, res) {
  var user = new User()

  user.id = req.param("user")
  user.fetch().then(function() {
    res.successT({
      user: {
        id: user.id,
        name: user.get("name") || user.get("phone")
      }
    })
  }, res.errorT)
}

module.exports.rooms = function(req, res) {
  var query = new Parse.Query(Conversation)
  var rooms = []

  query.each(function(conversation) {
    return conversation.get("user").fetch().then(function(user) {
      return rooms.push({
        user: {
          id: user.id,
          name: user.get("name") || user.get("phone")
        },
        unread: conversation.get("unread"),
        created: conversation.createdAt
      })
    })
  }).then(function() {
    res.successT({
      rooms: rooms.sort(function(a, b) {
        if(a.unread == b.unread) {
          return a.created - b.created
        } else {
          return b.unread - a.unread
        }
      })
    })
  }, res.errorT)
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
  var now = new Date()

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
        created: message.createdAt,
        duration: Moment.duration(message.createdAt - now).humanize(true)
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
