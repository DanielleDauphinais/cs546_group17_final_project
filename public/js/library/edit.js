(function ($) {
  /* Pre Populate with Data */
  let library = JSON.parse($("#libraryObject").text());
  $("#libraryName").val(library.name);
  $("#lat").val(library.coordinates[0]);
  $("#lng").val(library.coordinates[1]);
  $("#fullness").val(library.fullnessRating.toString());
  library.genres.forEach((element) => {
    /* First reply from https://stackoverflow.com/questions/426258/setting-checked-for-a-checkbox-with-jquery for reference*/
    $(`#${element}`).prop("checked", true);
  });
})(window.jQuery);
