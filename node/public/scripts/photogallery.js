'use strict';

(function() {
    document.addEventListener('DOMContentLoaded', function() {
        // This runs when the page finishes loading
        addPhotos(document.getElementById('photos-container'));
    });

    function addPhotos(container) {
        const apiUrl = '/api/photos?sortOrder=desc';
        console.log('GET ' + apiUrl);

        fetch(apiUrl)
            .then(function(response) {
                return response.json();
            })
            .then(function(photos) {
                console.log('photos: ' + JSON.stringify(photos));
                // Add each element to the container
                for (let i = 0, length = photos.length; i < length; i++) {
                    console.log('Adding ' + photos[i].id);
                    const link = document.createElement('a');
                    link.href = photos[i].path;
                    container.appendChild(link);
                    const img = document.createElement('img');
                    img.src = photos[i].path;
                    img.className = 'photo';
                    link.appendChild(img);
                }
            })
            .catch(function(error) {
                console.log('Error while getting photos: ' + error.message);
            });
    }
}());
