var User = Parse.User
var Assignment = Parse.Object.extend("Assignment")
var Message = Parse.Object.extend("Message")

module.exports.home = function(req, res) {
  var promise = Parse.Promise.as()
  var users = {}
  var ios = {}
  var sms = {}

  // All Users
  promise.then(function() {
    var query = new Parse.Query(User)

    return query.count(function(count) {
      users.total = count
    })
  }).then(function() {
    var query = new Parse.Query(User)

    query.exists("card")

    return query.count(function(count) {
      users.cards = count
    })
  }).then(function() {
    var query = new Parse.Query(User)

    query.greaterThan("charges", 0)
    query.select(["charges"])

    users.charges = 0

    return query.each(function(user) {
      users.charges += user.get("charges")
    })
  }).then(function() {
    var query = new Parse.Query(Assignment)

    query.equalTo("state", 3)

    return query.count(function(count) {
      users.questions = count
    })
  }).then(function() {
    var query = new Parse.Query(Message)

    return query.count(function(count) {
      users.messages = count
    })
  })

  // iOS Users
  .then(function() {
    var query = new Parse.Query(User)

    query.equalTo("source", "ios")

    return query.count(function(count) {
      ios.total = count
    })
  }).then(function() {
    var query = new Parse.Query(User)

    query.equalTo("source", "ios")
    query.exists("card")

    return query.count(function(count) {
      ios.cards = count
    })
  }).then(function() {
    var query = new Parse.Query(User)

    query.equalTo("source", "ios")
    query.greaterThan("charges", 0)
    query.select(["charges"])

    ios.charges = 0

    return query.each(function(user) {
      ios.charges += user.get("charges")
    })
  }).then(function() {
    var query = new Parse.Query(Assignment)
    var queryUser = new Parse.Query(User)

    queryUser.equalTo("source", "ios")

    query.matchesQuery("creator", queryUser)
    query.equalTo("state", 3)

    return query.count(function(count) {
      ios.questions = count
    })
  }).then(function() {
    var query = new Parse.Query(Message)
    var queryUser = new Parse.Query(User)

    queryUser.equalTo("source", "ios")
    query.matchesQuery("user", queryUser)

    return query.count(function(count) {
      ios.messages = count
    })
  })

  // SMS Users
  .then(function() {
    sms.total = users.total - ios.total
    sms.cards = users.cards - ios.cards
    sms.charges = users.charges - ios.charges
    sms.questions = users.questions - ios.questions
    sms.messages = users.messages - ios.messages
  })

  // Finished
  .then(function() {
    res.renderT("stats/index", {
      users: users,
      ios: ios,
      sms: sms
    })
  }, function(error) {
    console.log(error)
  })
}
