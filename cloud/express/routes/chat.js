var User = Parse.User
var Message = Parse.Object.extend("Message")

module.exports.home = function(req, res) {
  res.renderT("chat/index")
}
