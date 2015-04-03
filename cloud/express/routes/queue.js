module.exports.home = function(req, res) {
  res.render("queue/index", {
    template: 'queue/index'
  })
}
