// Init
$(function() {
  getQuestions()
  setInterval(getQuestions, 30000)
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


  if(data.paid < 1) {
    question.find(".claim").val("CLAIM (" + (data.paid * 100) + "¢)")
  } else {
    question.find(".claim").val("CLAIM ($" + data.paid + ")")
  }

  return question
}

function getQuestions() {
  $(".loading").text("Loading new questions").show()

  $.post("/questions", {
    _csrf: config.csrf
  }, function(data) {
    var questions = data.questions
    updateTitle(questions.length)

    if(questions.length != 0) {
      $(".loading").hide()
      $(".questions").html("")

      questions.forEach(function(question) {
        var question = buildQuestion(question)
        $(".questions").append(question)
        addListeners(question)
      })
    } else {
        $(".loading").text("No new questions. Good work!")
    }
  })
}

function updateTitle(count) {
  if(count > 0) {
    $("title").text(config.title + " (" + count + ")")
  } else {
    $("title").text(config.title)
  }
}
