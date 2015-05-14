// Chat Room
var ChatRoom = function ChatRoom() {

  // jQuery
  this.$window = $(window)
  this.$body = $("body")
  this.$header = $(".header")
  this.$sidebar = $(".sidebar")
  this.$users = $(".sidebar .users")
  this.$roomForm = $(".sidebar .roomForm")
  this.$roomInput = $(".sidebar .roomInput")
  this.$rooms = $(".rooms")

  // Variables
  this.focus = true
  this.room = null
  this.rooms = {}
  this.channel = pusher.subscribe(account + '_chat_room')

  // Initalize
  this.init()
}

ChatRoom.prototype.init = function() {
  this.resize()
  this.bindEvents()
  this.loadRooms()
  this.notifyPermission()
}

ChatRoom.prototype.bindEvents = function() {
  var _this = this

  this.$window.resize(this.resize.bind(this))
  this.channel.bind("message.new", this.newMessage.bind(this))
  this.channel.bind("message.read", this.readMessage.bind(this))
  this.$roomForm.submit(this.newRoom.bind(this))

  this.$window.focus(function() {
    _this.focus = true
  }).blur(function() {
    _this.focus = false
  })
}

ChatRoom.prototype.resize = function() {
  var room = this.room
  var height = this.$window.height() - this.$header.outerHeight()

  this.$sidebar.height(height).show()
  this.$rooms.height(height).show()

  if(room) {
    this.updateScroll(room)

    room.$room.$container.css({
      paddingTop: room.$room.$header.outerHeight() + "px",
      paddingBottom: room.$room.$bottom.outerHeight() + "px",
    })
  }
}

ChatRoom.prototype.searchMessages = function() {
  var room = this.room
  var search = room.$room.$search.val().toLowerCase()
  var override = search.length == 0

  this.room.messages.forEach(function(message) {
    var text = message.text.toLowerCase()
    var show = text.indexOf(search) != -1
    message.$message.toggle(override || show)
  })

  this.updateScroll(room, false)
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
      console.error(response.message)
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
      <div class="dot"></div>      \
    </div>                         \
  ')

  bar.$name = bar.find(".name").text(data.user.name || data.user.id)
  bar.$from = bar.find(".from")
  bar.$text = bar.find(".text")
  bar.$dot  = bar.find(".dot").toggle(data.unread)

  bar.click(function() {
    _this.activateRoom(_this.getRoom(data))
  })

  return bar
}

ChatRoom.prototype.updateBar = function(room) {
  var messagesLength = room.messages.length

  room.$bar.$name.text(room.user.name || room.user.id)
  room.$bar.find(".dot").toggle(room.unread)

  if(messagesLength > 0) {
    var message = room.messages[messagesLength - 1]
    var from = (message.type == 1) ? "You" : "User"

    room.$bar.$from.text(from + ":")
    room.$bar.$text.text(message.text)
  }
}

ChatRoom.prototype.sidebarToggle = function(room) {
  this.$body.toggleClass("openSidebar")
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
        <div class="scroll">                                                        \
          <div class="block"></div>                                                 \
          <div class="messages"></div>                                              \
        </div>                                                                      \
      </div>                                                                        \
      <div class="bottom">                                                          \
        <form class="messageForm">                                                  \
          <input class="messenger" type="text" placeholder="Message our user..." /> \
        </form>                                                                     \
      </div>                                                                        \
    </div>                                                                          \
  ')

  room.$name = room.find(".header .name").text(data.user.name || data.user.id).click(this.sidebarToggle.bind(this))
  room.$search = room.find(".header .search").keyup(this.searchMessages.bind(this))
  room.$messageForm = room.find(".bottom .messageForm").submit(this.createMessage.bind(this))
  room.$messenger = room.find(".bottom .messenger").focus(this.messengerFocus.bind(this))
  room.$messages = room.find(".messages")
  room.$scroll = room.find(".scroll")
  room.$block = room.find(".block")
  room.$container = room.find(".container")
  room.$header = room.find(".header")
  room.$bottom = room.find(".bottom")
  room.hide()

  return room
}

ChatRoom.prototype.updateRoom = function(room) {
  room.$room.$name.text(room.user.name || room.user.id)
}

ChatRoom.prototype.updateScroll = function(room, animate) {
  var $container = room.$room.$container
  var $messages = room.$room.$messages
  var $scroll = room.$room.$scroll
  var $block = room.$room.$block
  var height = $container.height() - $messages.height()

  $block.height(height)

  $scroll.animate({
    scrollTop: $messages.height() + $block.height()
  }, animate ? 500 : 0)
}

ChatRoom.prototype.loadMessages = function(room) {
  var _this = this
  var $loading = room.$room.find(".loading").show()

  $.get("/chat/" + room.id + "/messages", function(response) {
    if(!response.success) {
      _this.removeRoom(room)
      console.error(response.message)
    } else {
      room.messages = []
      var $messages = room.$room.$messages
      var $scroll = room.$room.$scroll

      var messages = response.messages.map(function(message) {
        var $message = _this.buildMessage(message)
        message.$message = $message
        message.created = new Date(message.created)
        message.updated = new Date(message.updated)
        room.messages.push(message)
        return $message
      })

      $loading.hide()
      $messages.html(messages)
      room.loaded.messages = true

      _this.updateBar(room)

      setTimeout(function() {
        _this.updateScroll(room, false)
      }, 100)
    }
  })
}

ChatRoom.prototype.getRoom = function(data) {
  var room

  if(!(data.user.id in this.rooms)) {
    room =  {
      id: data.user.id,
      user: data.user,
      messages: [],
      notifications: [],
      $room: this.$buildRoom(data),
      $bar: this.$buildBar(data),
      loaded: {
        messages: false,
        bar: false
      },
      unread: data.unread || false,
      created: new Date(data.created),
      updated: new Date(data.updated || data.created)
    }

    this.rooms[data.user.id] = room
    this.$rooms.append(room.$room)
    this.$users.append(room.$bar)
  } else {
    room = this.rooms[data.user.id]
  }

  if("unread" in  data) {
    room.unread = data.unread
  }

  if("name" in  data.user) {
    room.user.name = data.user.name
  }

  if("created" in data) {
    room.created = new Date(data.created)
  }

  if("updated" in data) {
    room.updated = new Date(data.updated)
  }

  this.updateBar(room)
  return room
}

ChatRoom.prototype.loadRooms = function() {
  var _this = this

  $.get("/chat/rooms", function(response) {
    if(!response.success) {
      console.error(response.message)
    } else {
      response.rooms.sort(function(a, b) {
        if(a.unread == b.unread) {
          return new Date(b.updated) - new Date(a.updated)
        } else {
          return b.unread - a.unread
        }
      }).forEach(function(data, i) {
        var room = _this.getRoom(data)

        if(!_this.room && i == 0) {
          _this.activateRoom(room)
        }
      })
    }
  })
}

ChatRoom.prototype.sortRooms = function() {
  var _this = this
  this.$users.empty()

  var rooms = []

  for (var key in this.rooms) {
    rooms.push(this.rooms[key])
  }

  rooms.sort(function(a, b) {
    if(a.unread == b.unread) {
      return new Date(b.updated) - new Date(a.updated)
    } else {
      return b.unread - a.unread
    }
  }).forEach(function(room, i) {
    room.$bar.click(function() {
      _this.activateRoom(room)
    })

    _this.$users.append(room.$bar)
  })
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

ChatRoom.prototype.removeRoom = function(room) {
  room.$room.remove()
  room.$bar.remove()

  delete this.rooms[room.id]
  this.activateRoom(this.rooms[Object.keys(this.rooms)[0]])
}

ChatRoom.prototype.setRoom = function(user) {
  if(user) {
    var _this = this

    $.get("/chat/" + user + "/room", function(response) {
      if(!response.success) {
        console.error(response.message)
      } else {
        room = _this.getRoom(response)

        room.user = response.user
        room.unread = response.unread || false
        room.loaded.bar = true

        _this.updateRoom(room)
        _this.updateBar(room)

        _this.activateRoom(room)
      }
    })
  }
}

ChatRoom.prototype.messengerFocus = function() {
  this.markRead(this.room)
}

ChatRoom.prototype.markRead = function(room) {
  if(room.unread) {
    $.post("/chat/" + room.id + "/read", {
      _csrf: config.csrf
    })
  }

  room.unread = false

  room.notifications.forEach(function(notification, i) {
    notification.close()

    if(i == room.notifications.length - 1) {
      room.notifications = []
    }
  })

  this.updateBar(room)
  this.sortRooms()
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
  this.markRead(room)
  this.updateScroll(room, false)
  this.$body.removeClass("openSidebar")

  room.$bar.addClass("active")
  history.pushState(null, null, "/chat/" + room.id)
}

ChatRoom.prototype.readMessage = function(data) {
  var room = this.getRoom(data)

  if(this.focus && this.room.id == room.id && room.unread) {
    this.markRead(room)
  } else {
    this.updateBar(room)
    this.sortRooms()
  }
}

ChatRoom.prototype.newMessage = function(data) {
  var room = this.getRoom(data)
  var $message = this.buildMessage(data)
  var $messages = room.$room.$messages
  var $scroll = room.$room.$scroll

  data.$message = $message
  data.created = new Date(data.created)
  room.messages.push(data)

  $messages.append($message)

  this.updateBar(room)
  this.updateScroll(room, true)

  if(!this.focus && data.type != 1) {
    this.notify(data, room)
  }
}

ChatRoom.prototype.buildMessage = function(data) {
  var room = this.getRoom(data)
  var message = $('                   \
    <div class="message">             \
      <div class="top">               \
        <div class="name"></div>      \
        <div class="duration"></div>  \
      </div>                          \
      <div class="text"></div>        \
    </div>                            \
  ')

  message.addClass(data.id)
  message.find(".text").text(data.text)
  message.find(".duration").text(data.duration)

  if(data.type == 1) {
    message.addClass("support")
    message.find(".name").text("Support Team")
  } else if(data.type == 2) {
    message.find(".name").text("User")
  }

  if(room.messages.length > 0) {
    var last = room.messages[room.messages.length - 1]
    var duration = new Date(data.created) - new Date(last.created)
    var days = Math.round(duration / 86400000)

    if(last && last.type == data.type && days == 0) {
      message.addClass("connected")
    }
  }

  return message
}

ChatRoom.prototype.notifyPermission = function() {
  if("Notification" in window) {
    Notification.requestPermission()
  }
}

ChatRoom.prototype.notify = function(message, room) {
  var _this = this

  if(!("Notification" in window)) {
    console.error("This browser does not support desktop notification");

  } else if(Notification.permission === "granted") {
    _this.createNotification(message, room)
  }
}

ChatRoom.prototype.createNotification = function(message, room) {
  var _this = this
  var title = (message.user.name || message.user.id) + " wrote:"
  var notification = new Notification(title, {
    icon: config.host + "/images/logo.png",
    body: message.text
  })

  notification.onclick = function() {
    window.focus()
    _this.activateRoom(room)
  }

  room.notifications.push(notification)
}

// Initalization
$(function() {
  window.chatRoom = new ChatRoom()
  chatRoom.setRoom(config.room)
})
