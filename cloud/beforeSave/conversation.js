Parse.Cloud.beforeSave("Conversation", function(req, res) {
  var conversation = req.object

  conversation.set("unread", !!conversation.get("unread"))
  res.success()
})
