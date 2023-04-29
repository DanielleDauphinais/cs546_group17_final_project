import { isNumber } from "./validators/util.js";

(function ($) {
  let fullnessForm = $("#fullness-form");
  let fullness = $("#fullness");
  let genresForm = $("#genres input");
  let error = $("#error");

  fullnessForm.submit(function (event) {
    let fullnessVal = fullness.val();
    try {
      let genres = genresForm.toArray();
      fullnessVal = parseInt(fullnessVal);
      if (!isNumber(fullnessVal)) {
        throw "You must select a fullness!";
      }
      error.text("");

      genres = genres.filter((input) => input.checked);

      if (genres.length === 0 && fullnessVal > 0)
        throw "You must select at least one genre if the library is non-empty!";

      if (genres.length > 0 && fullnessVal === 0)
        throw "You cannot select any genres if the library is empty!";

      if (fullnessVal < 0 || fullnessVal > 5) {
        throw "Improper Range on Fullness";
      }
    } catch (err) {
      /* Using Code Checking from login.js */
      if (typeof err === "string" && err.startsWith("VError")) {
        err = err.substr(1);
      }
      error.text(err);
      event.preventDefault();
    }
  });
})(window.jQuery);
