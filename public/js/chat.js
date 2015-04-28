// Support Methods
function onResize() {
  var header = $(".header")
  var sidebar = $(".sidebar")
  var rooms = $(".rooms, .room")
  var roomMessages = $(".rooms .room .messages")
  var roomHeader = $(".rooms .room .header")
  var roomBottom = $(".rooms .room .bottom")

  var height = $(window).height() - header.outerHeight()

  sidebar.height(height).show()
  rooms.height(height).show()

  var messagesHeight = height - roomHeader.outerHeight() - roomBottom.outerHeight()

  roomMessages.css({
    height: messagesHeight + "px",
    top: roomHeader.outerHeight() + "px"
  })
}

function subscribeChannel() {
  var channel = pusher.subscribe(account + '_chat_room')

  channel.bind("message.new", function(data) {
    $(".messages .container").text(data.message)
  })
}

// Initalization
$(function() {
  onResize()
  subscribeChannel()
})

$(window).resize(onResize)
