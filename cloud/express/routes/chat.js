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
  var userQueryA = new Parse.Query(User)
  var userQueryB = new Parse.Query(User)
  var userQuery = Parse.Query.or(userQueryA, userQueryB)
  var query = new Parse.Query(Conversation)

  userQueryA.equalTo("objectId", req.param("user"))
  userQueryB.equalTo("phone", req.param("user"))

  userQuery.first(function(user) {
    req.user = user

    query.equalTo("user", user)

    return query.first()
  }).then(function(conversation) {
    res.successT({
      user: {
        id: req.user.id,
        name: req.user.get("name") || req.user.get("phone")
      },
      unread: conversation.get("unread"),
      updated: conversation.updatedAt
    })
  }, res.errorT)
}

module.exports.read = function(req, res) {
  var query = new Parse.Query(Conversation)
  var user = new User()

  user.id = req.param("user")
  query.equalTo("user", user)

  query.first(function(conversation) {
    conversation.set("unread", false)

    return conversation.save()
  }).then(function() {
    res.successT()
  }, res.errorT)
}

module.exports.rooms = function(req, res) {
  var query = new Parse.Query(Conversation)
  var daysAgo = new Date()
  var rooms = []

  daysAgo.setDate(daysAgo.getDate() - 2)

  query.greaterThanOrEqualTo("updatedAt", daysAgo)

  query.each(function(conversation) {
    return conversation.get("user").fetch().then(function(user) {
      return rooms.push({
        user: {
          id: user.id,
          name: user.get("name") || user.get("phone")
        },
        unread: conversation.get("unread"),
        created: conversation.createdAt,
        updated: conversation.updatedAt
      })
    })
  }).then(function() {
    res.successT({
      rooms: rooms
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
        updated: message.updatedAt,
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
