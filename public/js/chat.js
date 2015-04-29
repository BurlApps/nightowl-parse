// Chat Room
var ChatRoom = function ChatRoom() {

  // jQuery
  this.$window = $(window)
  this.$header = $(".header")
  this.$sidebar = $(".sidebar")
  this.$users = $(".sidebar .users")
  this.$roomForm = $(".sidebar .roomForm")
  this.$roomInput = $(".sidebar .roomInput")
  this.$rooms = $(".rooms")

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
  var _this = this

  this.$window.resize(this.resize.bind(this))
  this.channel.bind("message.new", this.newMessage.bind(this))
  this.$roomForm.submit(this.newRoom.bind(this))
}

ChatRoom.prototype.resize = function() {
  var room = this.room
  var height = this.$window.height() - this.$header.outerHeight()

  this.$sidebar.height(height).show()
  this.$rooms.height(height).show()

  if(room) {
    room.$room.$container.css({
      paddingTop: room.$room.$header.outerHeight() + "px",
      paddingBottom: room.$room.$bottom.outerHeight() + "px",
    })
  }
}

ChatRoom.prototype.searchMessages = function() {
  var search = this.room.$room.$search.val().toLowerCase()
  var override = search.length == 0

  this.room.messages.forEach(function(message) {
    var text = message.text.toLowerCase()
    var show = text.indexOf(search) != -1
    message.$message.toggle(override || show)
  })
}

ChatRoom.prototype.createMessage = function(e) {
  e.preventDefault()
  e.stopPropagation()

  var data = {
    text: this.room.$room.find(".messenger").val(),
    user: this.room.user
  }

  $.post("/chat/" + this.room.user.id + "/message", {
    _csrf: config.csrf,
    text: this.room.$room.find(".messenger").val()
  }, function(response) {
    if(!response.success) {
      alert(response.message)
    }
  })

  this.room.$room.find(".messenger").val("")
}

ChatRoom.prototype.$buildBar = function(data) {
  var _this = this
  var bar = $('                    \
    <div class="user">             \
      <div class="name"></div>     \
      <div class="message">        \
        <span class="from"></span> \
        <span class="text"></span> \
      </div>                       \
    </div>                         \
  ')

  bar.$name = bar.find(".name").text(data.user.name || data.user.id)
  bar.$from = bar.find(".from")
  bar.$text = bar.find(".text")
  bar.click(function() {
    _this.activateRoom(_this.getRoom(data))
  })

  return bar
}

ChatRoom.prototype.updateBar = function(room) {
  var messagesLength = room.messages.length
  var $bar = room.$bar

  $bar.$name = $bar.$name.text(room.user.name || room.user.id)

  if(messagesLength > 0) {
    var message = room.messages[messagesLength - 1]
    var from = (message.type == 1) ? "You" : "User"

    $bar.$from.text(from + ":")
    $bar.$text.text(message.text)
  }
}

ChatRoom.prototype.$buildRoom = function(data) {
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
  room.$messages = room.find(".messages")
  room.$scroll = room.find(".messages .scroll")
  room.$container = room.find(".container")
  room.$header = room.find(".header")
  room.$bottom = room.find(".bottom")

  return room
}

ChatRoom.prototype.updateRoom = function(room) {
  room.$room.$name.text(room.user.name || room.user.id)
}

ChatRoom.prototype.loadMessages = function(room) {
  var _this = this
  var $loading = room.$room.find(".loading").show()

  $.get("/chat/" + room.user.id + "/messages", function(response) {
    if(!response.success) {
      alert(response.message)
    } else {
      room.messages = []
      var $scroll = room.$room.$scroll

      var messages = response.messages.map(function(message) {
        var $message = _this.buildMessage(message)
        message.$message = $message
        room.messages.push(message)
        return $message
      })

      $loading.hide()
      $scroll.html(messages)
      room.loaded.messages = true

      _this.updateBar(room)

      setTimeout(function() {
        room.$room.$messages.scrollTop($scroll.outerHeight())
      }, 100)
    }
  })
}

ChatRoom.prototype.getRoom = function(data) {
  if(!(data.user.id in this.rooms)) {
    var room =  {
      id: data.user.id,
      user: data.user,
      messages: [],
      $room: this.$buildRoom(data),
      $bar: this.$buildBar(data),
      loaded: {
        messages: false,
        bar: false
      }
    }

    this.rooms[data.user.id] = room
    this.$rooms.append(room.$room)
    this.$users.append(room.$bar)
  }

  return this.rooms[data.user.id]
}

ChatRoom.prototype.newRoom = function(e) {
  e.preventDefault()
  e.stopPropagation()

  var user = this.$roomInput.val()

  if(user.length > 0) {
    this.setRoom(user)
    this.$roomInput.val("")
  }
}

ChatRoom.prototype.setRoom = function(user) {
  if(user) {
    var _this = this
    var room = this.getRoom({
      user: {
        id: user
      }
    })

    if(!room.loaded.bar) {
      $.get("/chat/" + room.user.id + "/room", function(response) {
        if(!response.success) {
          alert(response.message)
        } else {
          room.user = response.user

          _this.updateRoom(room)
          _this.updateBar(room)
          room.loaded.bar = true
        }
      })
    }

    this.activateRoom(room)
  }
}

ChatRoom.prototype.activateRoom = function(room) {
  this.room = room
  this.$rooms.find(".room").hide()
  this.$users.find(".user").removeClass("active")
  room.$room.show()

  if(!room.loaded.messages) {
    this.loadMessages(room)
  }

  this.resize()
  room.$bar.addClass("active")
  room.$room.$messages.scrollTop(room.$room.$scroll.outerHeight())
  history.pushState(null, null, "/chat/" + room.id);
}

ChatRoom.prototype.newMessage = function(data) {
  var room = this.getRoom(data)
  var message = this.buildMessage(data)
  var $scroll = room.$room.$scroll

  data.$message = message
  room.messages.push(data)

  $scroll.append(message)

  this.updateBar(room)

  setTimeout(function() {
    room.$room.$messages.animate({
      scrollTop: $scroll.outerHeight()
    }, 500)
  }, 100)

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
  chatRoom.setRoom(config.room)
})