var DebugAccounts = Parse.Object.extend("DebugAccount")

Parse.Cloud.define("migration:debugAccounts", function(req, res) {
  Parse.Cloud.useMasterKey()

  var query = new Parse.Query(DebugAccounts)
  var accounts = {
    "Debug": [
      "0bzu64ADBGuHKglFYiCTYKR7tFZVaepLxVT1HXYe",
      "1VcBDc3O8TogJPqCbiZbfz9zezfI9HaYSHKgRLvG"
    ],
    "Brian": [
      "C46M4EM0yJZmiYKBpgmmoJLRFpgmuPFz8gSPw5A7",
      "w2cQc3TsNIy6xEVvkS4bt8RVk86A5Bc3NP4SWteL"
    ],
    "Nelson": [
      "AqMUSmYmu4RIUHjCd1QuiL1eN9wG1yt1BZmqFiJ1",
      "MUPyrGeiJNhb4AdvubKRpzlXYFlXkbsbbgTSWE5F"
    ]
  }

  query.each(function(account) {
    return account.destroy()
  }).then(function() {
    for(var key in accounts) {
      var account = new DebugAccounts()

      account.set("name", key)
      account.set("appID", accounts[key][0])
      account.set("appSecret", accounts[key][1])
      account.save()
    }
  }).then(function() {
    res.success("Successfully added debug accounts")
  }, function(error) {
    res.error(error)
  })
})
