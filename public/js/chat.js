// Chat Room
var ChatRoom = function ChatRoom() {

  // jQuery
  this.$window = $(window)
  this.$header = $(".header")
  this.$sidebar = $(".sidebar")
  this.$rooms = $(".rooms")
  this.$roomContainer = $(".room .container")
  this.$roomHeader = $(".room .header")
  this.$roomBottom = $(".room .bottom")

  // Variables
  this.room = null
  this.rooms = {}
  this.channel = pusher.subscribe(account + '_chat_room')

  // Initalize
  this.init()
}

ChatRoom.prototype.init = function() {
  this.resize()
  this.bindEvents()
}

ChatRoom.prototype.bindEvents = function() {
  this.$window.resize(this.resize.bind(this))
  this.channel.bind("message.new", this.newMessage.bind(this))
}

ChatRoom.prototype.resize = function() {
  var height = this.$window.height() - this.$header.outerHeight()

  this.$sidebar.height(height).show()
  this.$rooms.height(height).show()

  this.$roomContainer.css({
    paddingTop: this.$roomHeader.outerHeight() + "px",
    paddingBottom: this.$roomBottom.outerHeight() + "px",
  })
}

ChatRoom.prototype.triggerSearchMessages = function() {
  $(this).parents(".searchForm").submit()
}

ChatRoom.prototype.searchMessages = function() {
  var search = this.room.$room.$search.val()
  var messages = this.room.$room.find(".message")

  if(search.length == 0) {
    return messages.show()
  }

  messages.each(function() {
    var text = $(this).find(".text").text()
    var show = text.indexOf(search) != -1
    $(this).toggle(show)
  })
}

ChatRoom.prototype.createMessage = function(e) {
  e.preventDefault()
  e.stopPropagation()

  var data = {
    text: this.room.$room.find(".messenger").val(),
    user: this.room.user
  }

  $.post("/chat/" + this.room.user.id, {
    _csrf: config.csrf,
    text: this.room.$room.find(".messenger").val()
  }, function(response) {
    if(!response.success) {
      alert(response.message)
    }
  })

  this.room.$room.find(".messenger").val("")
}

ChatRoom.prototype.$getRoom = function(data) {
  var room = $('                                                                    \
    <div class="room">                                                              \
      <div class="header">                                                          \
        <div class="name"></div>                                                    \
         <div class="loading">(loading)</div>                                       \
          <input class="search" type="text" placeholder="Search messages..." />     \
        <div class="clear"></div>                                                   \
      </div>                                                                        \
      <div class="container">                                                       \
        <div class="messages">                                                      \
          <div class="scroll"></div>                                                \
        </div>                                                                      \
      </div>                                                                        \
      <div class="bottom">                                                          \
        <form class="messageForm">                                                  \
          <input class="messenger" type="text" placeholder="Message our user..." /> \
        </form>                                                                     \
      </div>                                                                        \
    </div>                                                                          \
  ')

  room.$name = room.find(".header .name").text(data.user.name || data.user.id)
  room.$search = room.find(".header .search").keyup(this.searchMessages.bind(this))
  room.$messageForm = room.find(".bottom .messageForm").submit(this.createMessage.bind(this))
  room.$scroll = room.find(".messages .scroll")

  return room
}

ChatRoom.prototype.$update = function() {
  this.$roomContainer = $(".room .container")
  this.$roomHeader = $(".room .header")
  this.$roomBottom = $(".room .bottom")
}


ChatRoom.prototype.getRoom = function(data) {
  if(!(data.user.id in this.rooms)) {
    var _this = this
    var room =  {
      user: data.user,
      messages: [],
      $room: this.$getRoom(data)
    }

    var $loading = room.$room.find(".loading").show()

    $.get("/chat/" + data.user.id, function(response) {
      if(!response.success) {
        alert(response.message)
      } else {
        room.messages = []
        var $scroll = room.$room.$scroll

        var messages = response.messages.map(function(message) {
          var ele = _this.buildMessage(message)
          room.messages.push(message)
          return ele
        })

        $loading.hide()
        $scroll.html(messages)
        room.$room.find(".messages").animate({
          scrollTop: $scroll.outerHeight()
        }, 500)
      }
    })

    this.rooms[data.user.id] = room
    this.$rooms.append(room.$room)
    this.$update()
  }

  return this.rooms[data.user.id]
}

ChatRoom.prototype.activateRoom = function(room) {
  this.room = room
  this.$rooms.find(".room").hide()
  room.$room.show()
  this.resize()
}

ChatRoom.prototype.newMessage = function(data) {
  var room = this.getRoom(data)
  var message = this.buildMessage(data)
  var scroll = room.$room.$scroll

  scroll.append(message)
  room.$room.find(".messages").animate({
    scrollTop: scroll.outerHeight()
  }, 500)
  room.messages.push(data)

  if(!this.room) {
    this.activateRoom(room)
  }
}

ChatRoom.prototype.buildMessage = function(data) {
  var room = this.getRoom(data)
  var message = $('            \
    <div class="message">      \
      <div class="name"></div> \
      <div class="text"></div> \
    </div>                     \
  ')

  message.addClass(data.id)
  message.find(".text").text(data.text)

  if(data.type == 1) {
    message.addClass("support")
    message.find(".name").text("Support Team")
  } else if(data.type == 2) {
    message.find(".name").text("User")
  }

  if(room.messages.length > 0) {
    var last = room.messages[room.messages.length - 1]

    if(last && last.type == data.type) {
      message.addClass("connected")
    }
  }

  return message
}

// Initalization
$(function() {
  window.chatRoom = new ChatRoom()
})
