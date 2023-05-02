const initMap = async () => {
    $.ajax({ method: 'GET', url: '/libraries/' }).done((data, status) => {
        const libraries = data;

        const tourStops = libraries.map(l => [ { lat: l.coordinates[0], lng: l.coordinates[1] }, l._id ]);

        /** If there aren't any libraries in the database let's focus our map to Gateway Center */
        let mapPositioning = { zoom: 15, center: { lat: 40.744, lng: -74.0324 } };

        if (tourStops.length > 0) mapPositioning = { zoom: 14, center: tourStops[0][0] };
        
        const map = new google.maps.Map(document.getElementById("map"), mapPositioning);

        tourStops.forEach(([position, title], i) => {
            console.log(position, title)
            const marker = new google.maps.Marker({
                position,
                map,
                title: `${i + 1}. ${title}`,
                label: `${i + 1}`,
                optimized: false,
            });

            marker.addListener("click", () => {
                window.parent.location.replace(`/libraries/${title}`)
            });
        });
    }).fail((jqXHR, textStatus, errorThrown) => {
        alert("Unable to fetch libraries");
    });
}

window.initMap = initMap;