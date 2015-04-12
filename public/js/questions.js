// Init
$(function() {
  getQuestions()
  setInterval(getQuestions, 10000)
})

// Util Methods
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
          <a class="good button">CLAIM</a>                                     \
          <a class="bad button">FLAG</a>                                       \
        </div>                                                                 \
        <div class="clear"></div>                                              \
      </div>                                                                   \
    </div>                                                                     \
  ')

  if(data.name) {
    question.find(".name").text(data.name)
  }


  if(data.paid < 1) {
    question.find(".claim").text("CLAIM (" + (data.paid * 100) + "¢)")
  } else {
    question.find(".claim").text("CLAIM ($" + data.paid + ")")
  }

  question.find(".good").attr("href", "/questions/" + data.id + "/claim")
  question.find(".bad").attr("href", "/questions/" + data.id + "/flag")
  return question
}

function getQuestions() {
  if($(".question").length == 0) {
    $(".loading").text("Loading new questions").show()
  }

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
