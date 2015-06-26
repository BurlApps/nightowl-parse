$(function() {
  var enablePosting = true
  
  $(".form").on("submit", function(e) {
    e.preventDefault()
    e.stopPropagation()
    
    if(enablePosting) {
      var form = $(this)
      var button = form.find(".submit").val("sending...")
      enablePosting = false
      
      $.post(form.attr("action"), form.serialize(), function(response) {
        button.toggleClass("error", !response.success)
	      button.toggleClass("active", response.success)

        if(response.success) {
	        button.val("awesome :)")
          
          if(response.user) {
            mixpanel.alias(response.user, mixpanel.get_distinct_id())
            mixpanel.people.set({
              ID: response.user,
              $name: response.name,
              $email: response.email,
            })
          }
          
	      	setTimeout(function() {
            window.location.href = response.next
          }, 300)
        } else {
	        enablePosting = true
	        button.val(response.message)
	        form.find("input[type=password]").val("")
        }
      })
    }
  })
})
