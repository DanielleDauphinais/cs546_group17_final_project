import {validationsForStrings} from './validators/util.js';

(function ($) {

  let newCommentForm = $('#newComment');
  let textArea = $('#text_input');
  let commentSection = $('#comments');
  let error = $('#commentError');

  let url = window.location.pathname;
  let libraryId = url.split('/')[2];

  newCommentForm.submit(function (event) {
    event.preventDefault();
    
    let text;

    try {
      text = textArea.val();
      validationsForStrings("Comment body", text);
    } catch (e) {
      console.log(e);
      console.log(error);
      error.hidden = false;
      error.innerHTML = e;
    }

    if (text) {
      let requestConfig = {
        method: 'POST',
        url: `/libraries/${libraryId}/comments`,
        contentType: 'application/json',
        data: JSON.stringify({
          text: text
        })
      };
      
      $.ajax(requestConfig).then(function (responseMessage) {
        let newElement = $(responseMessage);
        commentSection.append(newElement);
        textArea.val('');
        commentSection.focus();
      });
    }
  }).fail();// ADD HERE
})(window.jQuery);