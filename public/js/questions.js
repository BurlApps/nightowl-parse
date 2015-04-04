// Init
$(function() {
  window.count = 0

  getQuestions()

  setInterval(function() {
    if ($(".questions .question").length > 5) {
      getQuestions()
    }
  }, 30000)
})

// Util Methods
function submitQuestion(action) {

}

function addListeners(question) {
  question.find(".claim").click(submitQuestion("POST"))
  question.find(".flag").click(submitQuestion("PUT"))
}

function buildQuestion(data) {
    var question = $('                                                         \
      <div class="question ' + data.id + '" data-question="' + data.id + '">   \
      <div class="information">                                                \
        <div class="name">No Description Provided</div>                        \
        <div class="subject">' + data.subject + '</div>                        \
        <div class="clear"></div>                                              \
        <div class="image">                                                    \
          <img src="' + data.image + '"/>                                      \
        </div>                                                                 \
      </div>                                                                   \
      <div class="bottom">                                                     \
        <div class="time">' + data.duration + '...</div>                       \
        <div class="actions">                                                  \
          <input class="claim button" type="button" value="CLAIM">             \
          <input class="flag button" type="button" value="FLAG">               \
        </div>                                                                 \
        <div class="clear"></div>                                              \
      </div>                                                                   \
    </div>                                                                     \
  ')

  if(data.name) {
    question.find(".name").text(data.name)
  }

  return question
}

function getQuestions() {
  $(".loading").text("Loading new questions").show()

  $.post("/questions", {
    _csrf: config.csrf
  }, function(data) {
    var questions = data.questions
    window.count = questions.length
    updateTitle()

    if(questions.length != 0) {
      $(".loading").hide()

      questions.forEach(function(question) {
        if($("." + question.id).length == 0) {
          var question = buildQuestion(question)
          $(".questions").append(question)
          addListeners(question)
        }
      })
    } else {
        $(".loading").text("No new questions. Good work!")
    }
  })
}

function updateTitle() {
  if(window.count > 0) {
    $("title").text(config.title + " (" + window.count + ")")
  } else {
    $("title").text(config.title)
  }
}
