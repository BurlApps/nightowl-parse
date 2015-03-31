Parse.Cloud.afterSave(Parse.User, function(req, res) {
  var user = req.object

  if(user.existed()) return
  return Parse.Cloud.run("stripeRegister")
})
