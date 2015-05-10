// Require Underscore
var _ = require("underscore")

// Require All Migration Functions
require("cloud/migrations/debugAccount")
require("cloud/migrations/userTutor")
require("cloud/migrations/subjects")
require("cloud/migrations/messages")
require("cloud/migrations/userSource")

// Call Migrations
Parse.Cloud.job("runMigration", function(req, res) {
  Parse.Cloud.useMasterKey()

  var promise = Parse.Promise.as()
  var migrations = [
    "DebugAccounts", "UserTutor", "Subjects", "Message", "UserSource"
  ]

  _.each(migrations, function(migration) {
    promise = promise.then(function() {
      return Parse.Cloud.run("migration" + migration)
    })
  })

  promise.then(function() {
    res.success("Successfully ran migrations")
  }, function(error) {
    res.error(error.message)
  })
})
