var Installation = Parse.Installation
var User = Parse.User
var Assignment = Parse.Object.extend("Assignment")

Parse.Cloud.job("metrics", function(req, res) {
  var promise = Parse.Promise.as()
  var data = {
    "ahq": {},
    "adq": {},
    "maua": null,
    "mau": null,
    "uqc": [0, 0, 0, 0]
  }

  promise.then(function() {
    var queryInstallation = new Parse.Query(Installation)
    var queryAssignment = new Parse.Query(Assignment)

    queryInstallation.matches("timeZone", new RegExp("(America)|(US)", "ig"))
    queryAssignment.matchesKeyInQuery("creator", "user", queryInstallation)

    return queryAssignment.each(function(question) {
      var hour = question.createdAt.getUTCHours()

      if(data["ahq"][hour] == null) {
        data["ahq"][hour] = 0
      }

      data["ahq"][hour]++
    })
  }).then(function() {
    var queryAssignment = new Parse.Query(Assignment)

    return queryAssignment.each(function(question) {
      var day = question.createdAt.getUTCDay()

      if(data["adq"][day] == null) {
        data["adq"][day] = 0
      }

      data["adq"][day]++
    })
  }).then(function() {
    var queryInstallation = new Parse.Query(Installation)
    var queryAssignment = new Parse.Query(Assignment)
    var date = new Date()
    var users = {}

    date.setMonth(date.getMonth() - 1)

    queryInstallation.matches("timeZone", new RegExp("(America)|(US)", "ig"))
    queryAssignment.matchesKeyInQuery("creator", "user", queryInstallation)

    queryAssignment.greaterThanOrEqualTo("createdAt", date)

    return queryAssignment.each(function(question) {
      users[question.get("creator").objectId] = true
    }).then(function() {
      data["maua"] = Object.keys(users).length
    })
  }).then(function() {
    var queryAssignment = new Parse.Query(Assignment)
    var date = new Date()
    var users = {}

    date.setMonth(date.getMonth() - 1)
    queryAssignment.greaterThanOrEqualTo("createdAt", date)

    return queryAssignment.each(function(question) {
      users[question.get("creator").id] = true
    }).then(function() {
      data["mau"] = Object.keys(users).length
    })
  }).then(function() {
    var query = new Parse.Query(User)

    return query.each(function(user) {
      var queryAssignment = new Parse.Query(Assignment)

      queryAssignment.equalTo("creator", user)

      return queryAssignment.count(function(count) {
        data["uqc"][Math.min(count, 3)]++
      })
    })
  }).then(function() {
    console.log(data)
    res.success("Calculated hours successfully")
  }, function(error) {
    res.error(error.message)
  })
})
