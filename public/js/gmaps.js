const initMap = async () => {
    window.jQuery.ajax({ method: 'GET', url: '/libraries/' }).done((data, status) => {
        const libraries = data;

        const tourStops = libraries.map(l => [ { lat: l.coordinates[0], lng: l.coordinates[1] }, l._id ]);

        const map = new google.maps.Map(
            document.getElementById("map"),
            {
                zoom: 12,
                center: tourStops[0][0],
            }
        );

        const infoWindow = new google.maps.InfoWindow();

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