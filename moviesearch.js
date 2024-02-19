const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const resultsContainer = document.getElementById('results');
const autoCompleteContainer = document.getElementById('autoComplete');
const apiURL = 'https://movies-mock-api-s7oiqxtmzq-lz.a.run.app/api/movies';
const rateLimitDelay = 100;
const maxAutoCompleteItems = 5;

// Listen to either click on search button or "return"-key press
searchButton.addEventListener('click', () => fetchMovies(searchInput.value));

// In addition to listening to "return"-key, display autocomplete when pressing key. Using keydown to also listen to backspace.
searchInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
        fetchMovies(searchInput.value.trim());
        return;
    }

    // Simple throttle mechanism to limit requests
    clearTimeout(searchInput.delayTimer);
    searchInput.delayTimer = setTimeout(() => {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            autoComplete(searchTerm);
        } else {
            autoCompleteContainer.classList.remove('open');
        }
    }, rateLimitDelay);
});

// Listen to clicks on document elements in order to detect clicks outside autocomplete container to close it
document.addEventListener('click', event => {
    if (event.target.type !== 'li') {
        autoCompleteContainer.classList.remove('open');
    }
});

function fetchMovies(searchTerm) {
    // Insert spinner while loading data from API, using helper function
    displaySpinner(resultsContainer);

    // Also close any open autoComplete box
    autoCompleteContainer.classList.remove('open');

    fetch(apiURL + '?q=' + encodeURIComponent(searchTerm))
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                displayMovies(data);
            } else {
                resultsContainer.innerHTML = '<p>No movies found using your criteria</p>';
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            resultsContainer.innerHTML = '<p>Unfortunately an error occured while communicating with our service. Please try again momentarily</p>';
        });
}

function autoComplete(searchTerm) {
    const autoCompleteList = autoCompleteContainer.querySelector('ul');

    // Insert spinner into container while loading data from API
    autoCompleteContainer.classList.add('open');
    displaySpinner(autoCompleteList, 'dark');

    fetch(apiURL + '?q=' + encodeURIComponent(searchTerm))
        .then(response => response.json())
        .then(data => {
            // Clear the list
            autoCompleteList.innerHTML = '';

            if (data.length > 0) {
                // Limit the list to a new array
                const movies = data.slice(0, maxAutoCompleteItems);

                movies.forEach( movie => {
                    let movieItem = document.createElement('li');

                    movieItem.innerHTML = movie.name;

                    movieItem.addEventListener('click', () => {
                        searchInput.value = movie.name;

                        // Emulate click on searchButton in order not to repeat code
                        searchButton.dispatchEvent(new Event('click'));
                    });
                    autoCompleteList.appendChild(movieItem);
                });
            } else {
                autoCompleteList.innerHTML = '<li>No results found</li>';
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            autoCompleteContainer.innerHTML = '<p>Unfortunately an error occured while communicating with our service. Please try again momentarily</p>';
        });
}

function autoCompleteClick(phrase) {
    autoCompleteContainer.classList.remove("open");
}

function displayMovies(movies) {
    resultsContainer.innerHTML = ''; // Clear previous results
    movies.forEach(movie => {
        const movieElement = document.getElementById('template-movie').content.cloneNode(true);
        
        // Set movie poster and, in the case that the image is missing or cannot be found, set a default image through error event listener
        const moviePoster = movieElement.querySelector('._movie-thumb img');
        moviePoster.src = movie.thumbnail;
        moviePoster.addEventListener('error', e => {
            moviePoster.src = 'no-poster.jpg';
        });

        movieElement.querySelector('._movie-name').innerHTML = movie.name;
        
        // Convert movie duration from seconds to human-readable form with helper function
        movieElement.querySelector('.__movie-duration').innerHTML = timeHelper(movie.duration);

        // Merge array of genres
        movieElement.querySelector('.__movie-genres').innerHTML = movie.genres.join(', ');

        movieElement.querySelector('.__movie-description').innerHTML = movie.description;

        resultsContainer.appendChild(movieElement);
    });
}

function timeHelper(seconds) {
    let hours = 0 + Math.floor(seconds / 3600);
    let minutes = 0 + Math.floor((seconds % 3600) / 60);

    return hours + ' hours ' + minutes + ' minutes';
}

function displaySpinner(target, color = '') {
    let spinnerTemplate = document.getElementById('spinner').content.cloneNode(true);

    if (color) {
        spinnerTemplate.querySelector('.lds-spinner').classList.add(color);
    }

    target.innerHTML = '';
    target.appendChild(spinnerTemplate);
}