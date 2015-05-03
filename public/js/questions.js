// Init
$(function() {
  getQuestions()
  setInterval(getQuestions, 30000)
  $(".flagModal .background").click(cancelFlag)
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
  question.find(".bad").attr("href", "#").click(flagQuestion)
  return question
}

function flagQuestion() {
  var id = $(this).parents(".question").data("question")

  $(".flagModal .blurry").attr("href", "/questions/" + id + "/flag/7")
  $(".flagModal .many").attr("href", "/questions/" + id + "/flag/8")
  $(".flagModal .delete").attr("href", "/questions/" + id + "/delete")
  $(".flagModal").fadeIn(500)
}

function cancelFlag() {
  $(".flagModal").fadeOut(500)
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
    $(".questions").html("")

    if(questions.length != 0) {
      $(".loading").hide()

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
