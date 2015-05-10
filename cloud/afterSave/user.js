Parse.Cloud.afterSave(Parse.User, function(req, res) {
  var user = req.object
  var pushQuery = new Parse.Query(Parse.Installation)

  pushQuery.equalTo("user", user)

  return Parse.Push.send({
	  where: pushQuery,
	  data: {
      action: "settingsController.reload"
    }
  })

  if(user.existed()) return

  return Parse.Cloud.run("stripeRegister", {
    user: user.id
  })
})
