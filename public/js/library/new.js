import {validationsForStrings, checkImageFileString, isNumber} from '../validators/util.js';

let newLibraryForm = document.getElementById("new-Library-form");
let errorList = document.getElementById("error");

function removeElementsByClass(className){      // source: https://stackoverflow.com/questions/4777077/removing-elements-by-class-name
    const elements = document.getElementsByClassName(className);
    while(elements.length > 0){
        elements[0].parentNode.removeChild(elements[0]);
    }
}

// need to do the fullness test
if(newLibraryForm){
    newLibraryForm.addEventListener('submit', (event) => {
        let name = document.getElementById("libraryName");
        let lat =  document.getElementById("lat");
        let lng =  document.getElementById("lng");
        let image = document.getElementById("library-image");
        let fullnessVal = document.getElementById("fullness").value;

        removeElementsByClass("error-list");
        errorList.innerHTML = ""; 
        errorList.hidden = true;

        try {
            validationsForStrings("Library Name", name.value, false, {min: 3, max:40});
            document.getElementById("nameError").innerText = "";
        } catch (e) {
            if ((typeof e === "string") && e.startsWith("VError")) {
                e = e.substr(1);
            }

            document.getElementById("nameError").innerText = e;
            name.value =""
            errorList.innerHTML += `<li> ${e} </li>`;
        }

        try {
            if (!lat) throw `Error: latitude parameter should exist`;
            
            lat.value = Number(lat.value);

            if(lat.value==="0") throw `Error: latitude parameter should be selected using the map`;

            document.getElementById("latError").innerText = "";
        } catch (e) {
            document.getElementById("latError").innerText = e;
            lat.value = ""
            errorList.innerHTML += `<li> ${e} </li>`;
        }

        try {
            if (!lng) throw `Error: longitude parameter should exist`;

            lng.value = Number(lng.value);
            
            if(lng.value==="0") throw `Error: longitude parameter should be selected using the map`;

            document.getElementById("lngError").innerText = "";
        } catch (e) {
            document.getElementById("lngError").innerText = e;
            lng.value = ""
            errorList.innerHTML += `<li> ${e} </li>`;
        }

        try {
            checkImageFileString(image.value, "Input Image");

            document.getElementById("imageError").innerText = "";
        } catch (e) {
            document.getElementById("imageError").innerText = e;

            errorList.innerHTML += `<li> ${e} </li>`;
            image.value = null;
        }

        let genresForm, genres;
        try {
            genresForm = $("#genres input");
            genres = genresForm.toArray();
            genres = genres.filter((input) => input.checked);

            document.getElementById("genresError").innerText = "";
        } catch (e) {
            if (typeof e === "string" && e.startsWith("VError")) {
                e = e.substr(1);
            }

            document.getElementById("genresError").innerText = e;

            errorList.innerHTML += `<li> ${e} </li>`;
        }

        try {
            if (!isNumber(Number(fullnessVal))) throw "You must select a fullness!";

            if (fullnessVal < 0 || fullnessVal > 5) throw "Improper Range on Fullness";

            document.getElementById("fullnessError").innerText = "";
        } catch (e) {
            document.getElementById("fullnessError").innerText = e;
            errorList.innerHTML += `<li> ${e} </li>`;
        }

        try {
            if (genres.length === 0 && fullnessVal > 0) throw "You must select at least one genre if the library is non-empty!";
            
            if (genres.length > 0 && fullnessVal === 0) throw "You cannot select any genres if the library is empty!";

            document.getElementById("genresError").innerText = "";
        } catch (e) {
            errorList.innerHTML += `<li> ${e} </li>`;
            document.getElementById("genresError").innerText = "";
        }
        
        if(errorList.innerHTML !== ""){
            errorList.hidden = false;
            event.preventDefault()
        }
    })
}