var Installation = Parse.Installation
var User = Parse.User
var Assignment = Parse.Object.extend("Assignment")

Parse.Cloud.job("metrics", function(req, res) {
  var promise = Parse.Promise.as()
  var data = {
    "ahq": {},
    "adq": {},
    "maua": null,
    "mau": null
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
    var date = new Date()

    date.setMonth(date.getMonth() - 1)

    queryInstallation.matches("timeZone", new RegExp("(America)|(US)", "ig"))
    queryInstallation.greaterThanOrEqualTo("updatedAt", date)

    return queryInstallation.count(function(count) {
      data["maua"] = count
    })
  }).then(function() {
    var queryInstallation = new Parse.Query(Installation)
    var date = new Date()

    date.setMonth(date.getMonth() - 1)

    queryInstallation.greaterThanOrEqualTo("updatedAt", date)

    return queryInstallation.count(function(count) {
      data["mau"] = count
    })
  }).then(function() {
    console.log(data)
    res.success("Calculated hours successfully")
  }, function(error) {
    res.error(error.message)
  })
})
