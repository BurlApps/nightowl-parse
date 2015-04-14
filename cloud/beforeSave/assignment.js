var Settings = require("cloud/utils/settings")
var Image = require("parse-image")

Parse.Cloud.beforeSave("Assignment", function(req, res) {
  var assignment = req.object
  var maxSize = 800
  var dirtyKeys = assignment.dirtyKeys()

  // Only Resize When Question Image Has Changed
  if(dirtyKeys.indexOf("question") == -1) return res.success()

  Parse.Cloud.httpRequest({
    url: assignment.get("question").url()
  }).then(function(data) {
    var image = new Image()
    return image.setData(data.buffer)
  }).then(function(image) {
    var ratio

    if(image.height() > maxSize || image.width() > maxSize) {
      if(image.height() > image.width()) {
        ratio = maxSize/image.height()
      } else {
        ratio = maxSize/image.width()
      }

      return image.scale({
        ratio: ratio
      })
    } else {
      return image
    }
  }).then(function(image) {
    return image.setFormat("JPEG")
  }).then(function(image) {
    return image.data()
  }).then(function(buffer) {
    var base64 = buffer.toString("base64")
    var image = new Parse.File("image.jpg", {
      base64: base64
    })
    return image.save()
  }).then(function(image) {
    assignment.set("question", image)
  }).then(function(result) {
    res.success()
  }, function(error) {
    res.error(error)
  })
})
