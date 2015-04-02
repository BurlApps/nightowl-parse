// Require Underscore
var _ = require("underscore")

// Require All Migration Functions
require("cloud/migrations/debugAccount")
require("cloud/migrations/userTutorField")
require("cloud/migrations/subjects")

// Call Migrations
Parse.Cloud.job("runMigration", function(req, res) {
  Parse.Cloud.useMasterKey()

  var promise = Parse.Promise.as()
  var migrations = ["DebugAccounts", "UserTutorField", "Subjects"]

  _.each(migrations, function(migration) {
    promise = promise.then(function() {
      return Parse.Cloud.run("migration" + migration)
    })
  })

  promise.then(function() {
    res.success("Successfully ran migrations")
  }, function(error) {
    console.log(error)
    res.error(error.description)
  })
})
