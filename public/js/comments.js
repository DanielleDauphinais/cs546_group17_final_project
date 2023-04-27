import {validationsForStrings} from './validators/util.js';

(function ($) {

  let newCommentForm = $('#newComment');
  let text = $('#text_input');
  let commentSection = $('#comments');
  let userid = $('#userid');
  let libraryid;// = $('libraryid');
  let error = $('#error');
  //let userid = req.session.user._id;
  //let libraryid;

  newCommentForm.submit(function (event) {
    event.preventDefault();

    let currentLink = $(this);
    libraryid = currentLink.data('id');
    console.log(libraryid);

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