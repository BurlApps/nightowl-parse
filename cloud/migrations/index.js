// Require All Migration Functions
require("cloud/migrations/debugAccount")

// Call Migrations
Parse.Cloud.job("runMigration", function(req, res) {
  Parse.Cloud.useMasterKey()

  var promise = Parse.Promise.as()

  promise.then(function() {
    return Parse.Cloud.run("debugAccounts")
  }).then(function() {
    res.success("Successfully ran migrations")
  }, function(error) {
    res.error(error)
  })
})
