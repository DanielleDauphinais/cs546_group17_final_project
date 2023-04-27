(function ($) {

  let newCommentForm = $('#newComment');
  let text = $('#text_input');
  let commentSection = $('#comments');
  let userid = req.session.user._id;
  let libraryid;

  newCommentForm.submit(function (event) {
    event.preventDefault();

    let text = text.val();
    //INPUT VALIDATION TODO
    let dateCreated = new Date().toLocaleDateString();

    if (text && dateCreated) {
      
      let requestConfig = {
        method: 'POST',
        url: `/${libraryid}/comments`,
        contentType: 'application/json',
        data: JSON.stringify({
          userId: userid,
          dateCreated: dateCreated,
          text: text,
          likes: []
        })
      };
      
      $.ajax(requestConfig).then(function (responseMessage) {
        let newElement = $(responseMessage);
        bindEventsToTodoItem(newElement);//Needs more work
        commentSection.append(newElement);
        newNameInput.val('');
        newDecriptionArea.val('');
        newNameInput.focus();
      });
    }
  });
})(window.jQuery);
