$(function() {
  $('.input.cvc').payment("formatCardCVC")
  $('.input.expiration').payment("formatCardExpiry")
  $('.input.card').payment("formatCardNumber")
  $('.form').submit(function(e) {
    e.preventDefault()
    e.stopPropagation()

    var form = $(this)
    var button = form.find(".submit").removeClass("error").val("sending...")
    var expiration = $('.expiration').val().split("/")

    Stripe.card.createToken({
      number: $('.card').val(),
      cvc: $('.cvc').val(),
      exp_month: parseInt(expiration[0]),
      exp_year: parseInt(expiration[1])
    }, function(status, response) {
      if(response.error) {
        button.addClass("error").val(response.error.message)
      } else {
        Parse.Cloud.run("addCard", {
          lastFour: response.card.last4,
          card: response.id,
          user: config.user
        }).then(function() {
          return Parse.Cloud.run("assignmentActivate", {
            user: config.user
          })
        }).then(function() {
          window.location.href = "/user/updated"
        }, function(error) {
          button.addClass("error").val(error.message)
        })
      }
    })
  })
})
