import {validationsForStrings} from './validators/util.js';

(function ($) {

  let newCommentForm = $('#newComment');
  let textArea = $('#text_input');
  let commentSection = $('#comments');
  let error = $('#commentCreateError');

  let url = window.location.pathname;
  let libraryId = url.split('/')[2];

  newCommentForm.submit(function (event) {
    event.preventDefault();
    
    let text;

    try {
      text = textArea.val();
      validationsForStrings("Comment body", text);
      //$(error).attr("hidden", true);
      error.text("");
    } catch (e) {
      event.preventDefault();
      console.log(e);
      //$(error).attr("hidden", false);
      // $(error).attr("display", "block");
      // $(error).attr("innerHTML", e); // Not sure why this isn't rendering???
      error.text(e);
      return;
    }

    
      let requestConfig = {
        method: 'POST',
        url: `/libraries/${libraryId}/comments`,
        contentType: 'application/json',
        data: JSON.stringify({
          text: text
        })
      };
      
      console.log("Made it here");
      $.ajax(requestConfig).then(function (responseMessage) {
        let newElement = $(responseMessage);
        commentSection.append(newElement);
        textArea.val('');
        commentSection.focus();
      });
  });
})(window.jQuery);