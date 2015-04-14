var Settings = require("cloud/utils/settings")
var Image = require("parse-image")

Parse.Cloud.beforeSave("Assignment", function(req, res) {
   var assignment = req.object
   if(!assignment.isNew()) return res.success()
   
   Parse.Cloud.httpRequest({
      url: assignment.get("question").url()
    }).then(function(data) {
      var image = new Image()
      return image.setData(data.buffer)
    }).then(function(image) {
      var sizeCheck = (image.height() > 800 || image.width() > 800)
      if(sizeCheck === true) {
         if(image.height() > image.width()) {
            var ratio = 800/image.height()
            return image.scale({
              ratio: ratio
            })
         } else {
            var ratio = 800/image.width()
            return image.scale({
              ratio: ratio
            })
         }
      } 
    }).then(function(image) {
      // Make sure it's a JPEG to save disk space and bandwidth.
      return image.setFormat("JPEG")
    }).then(function(image) {
      // Get the image data in a Buffer.
      return image.data()
    }).then(function(buffer) {
      // Save the image into a new file.
      var base64 = buffer.toString("base64")
      var cropped = new Parse.File("image.jpg", { base64: base64 })
      return cropped.save()
    }).then(function(cropped) {
      // Attach the image file to the original object.
      assignment.set("question", cropped)
    }).then(function(result) {
      res.success()
    }, function(error) {
      res.error(error)
    })
   
} )