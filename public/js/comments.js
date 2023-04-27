import {validationsForStrings} from './validators/util.js';

(function ($) {

  let newCommentForm = $('#newComment');
  let text = $('#text_input');
  let commentSection = $('#comments');
  let userid = $('#userid');
  let error = $('#error');

  newCommentForm.submit(function (event) {
    event.preventDefault();

    let currentLink = $(this);
    libraryid = currentLink.data('id');
    console.log(libraryid);
    console.log(text);

    let text;
    let dateCreated = new Date().toLocaleDateString();
    
    try {
      text = text.val();
      validationsForStrings("Comment body", text);
    } catch (e) {
      error.hidden = false;
      error.innerHTML = e;
    }

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
        commentSection.append(newElement);
        text.val('');
        commentSection.focus();
      });
    }
  });
})(window.jQuery);