
let lat, lng;

document.addEventListener("DOMContentLoaded", (e) => {
lat = parent.document.getElementById("lat");
lng = parent.document.getElementById("lng");
})

let map;
let locationInfo = null
let BVlocationSet = false


let message = document.getElementById("hiddenMessage")

const initMap = async () => {
    const myLatlng = { lat: 40.744, lng: -74.0324 };
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 14,
    center: myLatlng,
  });
  // Create the initial InfoWindow.
  let infoWindow = new google.maps.InfoWindow({
    content: "Click the map to get Lat/Lng!",
    position: myLatlng,
  });

  infoWindow.open(map);
  // Configure the click listener.
  map.addListener("click", (mapsMouseEvent) => {
    // Close the current InfoWindow.
    infoWindow.close();
    // Create a new InfoWindow.
    infoWindow = new google.maps.InfoWindow({
      position: mapsMouseEvent.latLng,
    });
    infoWindow.setContent(
        "location info added to the form!"
        //JSON.stringify(mapsMouseEvent.latLng.toJSON(), null, 2)
    );
    infoWindow.open(map);
    locationInfo = JSON.stringify(mapsMouseEvent.latLng.toJSON(), null, 2)
    lat.value =  JSON.parse(locationInfo).lat 
    lng.value = JSON.parse(locationInfo).lng 
  });
}

window.initMap = initMap;
