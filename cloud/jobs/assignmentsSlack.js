var Assignment = Parse.Object.extend("Assignment")

Parse.Cloud.job("assignmentsSlack", function(req, res) {
  Parse.Cloud.useMasterKey()

  var query = new Parse.Query(Assignment)

  query.equalTo("state", 1)
  return query.count().then(function(count) {
    if(count == 0) return true

    return Parse.Cloud.run("notifyAssignmentSlack", {
      count: count
    })
  }).then(function(data) {
    res.success("Notified Admins on Slack")
  }, function(error) {
    console.error(error)
    res.error(error.message)
  })
})
