var Installation = Parse.Installation
var Assignment = Parse.Object.extend("Assignment")

Parse.Cloud.job("activeHours", function(req, res) {
  var queryInstallation = new Parse.Query(Installation)
  var queryAssignment = new Parse.Query(Assignment)
  var hours = []

  queryInstallation.matches("timeZone", new RegExp("America", "i"))

  queryAssignment.matchesKeyInQuery("creator", "user", queryInstallation)

  queryAssignment.each(function(question) {
    var date = question.get("createdAt")
    var hour = date.getUTCHours()

    if(hours[hour] == null) {
      hours[hour] = 0
    }

    hours[hour]++
  }).then(function() {
    console.log(hours)
    res.success("Calculated hours successfully")
  }, function(error) {
    res.error(error.message)
  })
})
