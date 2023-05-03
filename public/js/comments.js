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
      error.text("");
    } catch (e) {
      event.preventDefault();
      console.log(e);
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
      
      $.ajax(requestConfig).then(function (responseMessage) {
        let newElement = $(responseMessage);
        commentSection.append(newElement);
        textArea.val('');
        commentSection.focus();
      });
  });
})(window.jQuery);



let comment = document.getElementById("comments");
let comments = comment.childNodes;

for (let i = 1; i < comments.length; i+=2){
  
}

function editComment(event) {
  try {
    validationsForStrings("Comment body", text);
  } catch (e) {
    event.preventDefault();
  }
} 