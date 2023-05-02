import {
  validationsForStrings,
  checkImageFileString,
  isNumber,
} from "../validators/util.js";

let newLibraryForm = document.getElementById("new-Library-form");
let errorList = document.getElementById("error");

function removeElementsByClass(className) {
  // source: https://stackoverflow.com/questions/4777077/removing-elements-by-class-name
  const elements = document.getElementsByClassName(className);
  while (elements.length > 0) {
    elements[0].parentNode.removeChild(elements[0]);
  }
}

// need to do the fullness test
if (newLibraryForm) {
  newLibraryForm.addEventListener("submit", (event) => {
    let name = document.getElementById("libraryName");
    let lat = document.getElementById("lat");
    let lng = document.getElementById("lng");
    let image = document.getElementById("library-image");
    let fullnessVal = document.getElementById("fullness").value;
    console.log(fullnessVal);
    removeElementsByClass("error-list");
    errorList.innerHTML = "";
    errorList.hidden = true;
    try {
      validationsForStrings("Library Name", name.value, false, {
        min: 3,
        max: 40,
      });
    } catch (e) {
      if (typeof e === "string" && e.startsWith("VError")) {
        e = e.substr(1);
      }
      name.value = "";
      errorList.innerHTML += `<li> ${e} </li>`;
    }
    try {
      if (!lat) throw `Error: latitude parameter should exist`;
      lat.value = Number(lat.value);
      if (lat.value === "0")
        throw `Error: latitude parameter should be selected using the map`;
    } catch (e) {
      lat.value = "";
      errorList.innerHTML += `<li> ${e} </li>`;
    }
    try {
      if (!lng) throw `Error: longitude parameter should exist`;
      lng.value = Number(lng.value);
      if (lng.value === "0")
        throw `Error: longitude parameter should be selected using the map`;
    } catch (e) {
      lng.value = "";
      errorList.innerHTML += `<li> ${e} </li>`;
    }
    try {
      checkImageFileString(image.value, "Input Image");
    } catch (e) {
      errorList.innerHTML += `<li> ${e} </li>`;
      image.value = null;
    }
    let genresForm, genres;
    try {
      (function ($) {
        genresForm = $("#genres input");
      })(window.jQuery);
      genres = genresForm.toArray();
      genres = genres.filter((input) => input.checked);
    } catch (e) {
      if (typeof e === "string" && e.startsWith("VError")) {
        e = e.substr(1);
      }
      errorList.innerHTML += `<li> ${e} </li>`;
    }
    try {
      if (!isNumber(Number(fullnessVal))) throw "You must select a fullness!";
      if (fullnessVal < 0 || fullnessVal > 5)
        throw "Improper Range on Fullness";
    } catch (e) {
      errorList.innerHTML += `<li> ${e} </li>`;
    }
    try {
      if (genres.length === 0 && fullnessVal > 0)
        throw "You must select at least one genre if the library is non-empty!";
      if (genres.length > 0 && fullnessVal === 0)
        throw "You cannot select any genres if the library is empty!";
    } catch (e) {
      errorList.innerHTML += `<li> ${e} </li>`;
    }
    if (errorList.innerHTML !== "") {
      errorList.hidden = false;
      event.preventDefault();
    }
  });
}
