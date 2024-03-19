let emotion, audio, nextbtn, prevbtn, seekslider, volumeslider, seeking = false, seekto,
    curtimetext, durtimetext, current_song, dir, playlist, ext, agent, repeat, setvolume, angry_playlist, angry_title,
    angry_poster, happy_playlist, happy_title, happy_poster, calm_playlist, calm_title, calm_poster, sad_playlist,
    sad_title, sad_poster, playlist_index;

let currentSongIndex = -1;
let currentSongList = [];
let currentEmotion = '';
const emotionToNumericValue = {
    'angry': 1,
    'disgust': 2,
    'fear': 3,
    'happy': 4,
    'sad': 5,
    'neutral': 6,
    'surprise': 7
};


const emotionBackgroundColor = {
    'angry': 'rgba(255, 99, 132, 0.2)',
    'disgust': 'rgba(75, 192, 192, 0.2)',
    'fear': 'rgba(153, 102, 255, 0.2)',
    'happy': 'rgba(255, 206, 86, 0.2)',
    'sad': 'rgba(54, 162, 235, 0.2)',
    'neutral': 'rgba(201, 203, 207, 0.2)',
    'surprise': 'rgba(255, 159, 64, 0.2)'
};

const emotionBorderColor = {
    'angry': 'rgba(255, 99, 132, 1)',
    'disgust': 'rgba(75, 192, 192, 1)',
    'fear': 'rgba(153, 102, 255, 1)',
    'happy': 'rgba(255, 206, 86, 1)',
    'sad': 'rgba(54, 162, 235, 1)',
    'neutral': 'rgba(201, 203, 207, 1)',
    'surprise': 'rgba(255, 159, 64, 1)'
};

const playbtn = document.getElementById("playpausebtn");
nextbtn = document.getElementById("nextbtn");
prevbtn = document.getElementById("prevbtn");
const mutebtn = document.getElementById("mutebtn");
curtimetext = document.getElementById("curtimetext");
durtimetext = document.getElementById("durtimetext");
current_song = document.getElementById("current_song");
seekslider = document.getElementById("seekslider");

audio = new Audio();
audio.loop = false;



document.addEventListener('DOMContentLoaded', () => {
    const emotion = document.body.getAttribute('data-emotion');
    document.body.className = emotion;
    const nextbtn = document.getElementById('nextbtn');
    const prevbtn = document.getElementById('prevbtn');
    
    const volumeslider = document.getElementById("volumeslider");
    const repeat = document.getElementById("repeat");

    playbtn.addEventListener("click", playPause);
    nextbtn.addEventListener('click', nextSong);
    prevbtn.addEventListener('click', prevSong);
    
    volumeslider.addEventListener("mousemove", setvolume);
    repeat.addEventListener("click", loop);
    changeSongBasedOnEmotion(emotion);
    recordEmotion(emotion);

});

document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('emotionChart');
    if (canvas) {
        // Only execute if on the evolution page
        fetch('/get_emotion_data')
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    renderChart(data);
                } else {
                    console.log('No data available to render chart.');
                }
            })
            .catch(error => console.error('Error fetching emotion data:', error));
    }
});



function changeSongBasedOnEmotion(emotion) {
    currentEmotion = emotion;
    document.querySelector('#status').innerHTML = `Current emotion: ${emotion}`;

    fetch(`/songs/${emotion}`).then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    }).then(songs => {
        if (songs.length > 0) {
            currentSongList = songs;
            currentSongIndex = Math.floor(Math.random() * songs.length);
            playSongAtIndex(currentSongIndex);
        } else {
            console.log('No songs available for emotion:', emotion);
        }
    }).catch(error => {
        console.error('Error fetching songs:', error);
    });

}

// Function to play a song at a given index
function playSongAtIndex(index) {
    const songFile = currentSongList[index];
    audio.src = `/static/songs/${currentEmotion}/${encodeURIComponent(songFile)}`;
    current_song.innerHTML = songFile.replace('.mp3', '');
    audio.play().catch(e => console.error('Error playing the song:', e));
    playbtn.querySelector("img").src = "/static/images/pause.png";
}



mutebtn.addEventListener("click", mute);
seekslider.addEventListener("mousedown", function (event) {
    seeking = true;
    seek(event);
});
seekslider.addEventListener("mousemove", function (event) {
    seek(event);
})
seekslider.addEventListener("mouseup", function () {
    seeking = false;
})

audio.addEventListener("timeupdate", function () {
    seektimeupdate();
})
audio.addEventListener("ended", function () {
    switchTrack(emotion);
})



function playPause() {
    if (audio.paused) {
        playbtn.querySelector("img").src = "/static/images/pause.png";
        audio.play();
    } else {
        playbtn.querySelector("img").src = "/static/images/play.png";
        audio.pause();
    }
}


// Function to fetch song list for the emotion
// function fetchSongsForEmotion(emotion) {
//     document.getElementById("playpausebtn").src = "/static/images/pause.png";
//     currentEmotion = emotion;
//     fetch(`/songs/${currentEmotion}`).then(response => {
//         if (!response.ok) {
//             throw new Error('Network response was not ok ' + response.statusText);
//         }
//         return response.json();
//     }).then(songs => {
//         currentSongList = songs;
//         currentSongIndex = -1; // Reset index to -1 so nextSong starts at 0
//     }).catch(error => {
//         console.error('Error fetching songs:', error);
//     });
// }



function nextSong(emotion) {
    if (currentSongList.length > 0) {
        currentSongIndex = (currentSongIndex + 1) % currentSongList.length;
        playSongAtIndex(currentSongIndex);
    }
}


function prevSong(emotion) {
    if (currentSongList.length > 0) {
        currentSongIndex = (currentSongIndex - 1 + currentSongList.length) % currentSongList.length;
        playSongAtIndex(currentSongIndex);
    }
}


function mute() {
    if (audio.muted) {
        audio.muted = false;
        mutebtn.querySelector("img").src = "/static/images/speaker.png";
    } else {
        audio.muted = true;
        mutebtn.querySelector("img").src = "/static/images/mute.png";
    }
}


function seek(event) {
    if (audio.duration == 0) {
        null
    } else {
        if (seeking) {
            seekslider.value = event.clientX - seekslider.offsetLeft;
            seekto = audio.duration * (seekslider.value / 100);
            audio.currentTime = seekto;
        }
    }
}


function setVolume() {
    audio.volume = volumeslider.value / 100;
}


function seektimeupdate() {
    if (audio.duration) {
        let temp = audio.currentTime * (100 / audio.duration);
        seekslider.value = temp;
        var curmins = Math.floor(audio.currentTime / 60);
        var cursecs = Math.floor(audio.currentTime - curmins * 60);
        var durmins = Math.floor(audio.duration / 60);
        var dursecs = Math.floor(audio.duration - durmins * 60);
        if (cursecs < 10) {
            cursecs = "0" + cursecs
        }
        if (curmins < 10) {
            curmins = "0" + curmins
        }
        if (dursecs < 10) {
            dursecs = "0" + dursecs
        }
        if (durmins < 10) {
            durmins = "0" + durmins
        }
        curtimetext.innerHTML = curmins + ":" + cursecs;
        durtimetext.innerHTML = durmins + ":" + dursecs;
    } else {
        curtimetext.innerHTML = "00:00";
        durtimetext.innerHTML = "00:00";
    }
}

function loop() {
    if (audio.loop) {
        audio.loop = false;
        document.getElementById("repeat img").src = "/static/images/loop.png";
    } else {
        audio.loop = true;
        document.getElementById("repeat img").src = "/static/images/loop1.png";
    }
}

function switchTrack(emotion) {
    currentSongIndex = Math.floor(Math.random() * currentSongList.length);
    playSongAtIndex(currentSongIndex);
}

function recordEmotion(emotion) {
    fetch('/record_emotion', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `emotion=${emotion}`
    })
    .then(response => {
        if(response.ok) {
            console.log('Emotion recorded successfully');
        } else {
            console.error('Failed to record emotion');
        }
    })
    .catch(error => console.error('Error recording emotion:', error));
}




function renderChart(data) {
    const ctx = document.getElementById('emotionChart').getContext('2d');
    const labels = data.map(record => new Date(record.timestamp).toLocaleTimeString());
    const emotions = data.map(record => emotionToNumericValue[record.emotion] || 0);

    // Create arrays for background and border colors
    const backgroundColors = data.map(record => emotionBackgroundColor[record.emotion] || 'rgba(0, 0, 0, 0.2)');
    const borderColors = data.map(record => emotionBorderColor[record.emotion] || 'rgba(0, 0, 0, 1)');

    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Emotions Over Time',
                data: emotions,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        // Convert numeric values back to emotion names for the axis labels
                        callback: function(value, index, values) {
                            return Object.keys(emotionToNumericValue).find(key => emotionToNumericValue[key] === value) || '';
                        }
                    }
                }
                
            }
        }
    });
}



// function renderChart(data) {
//     const ctx = document.getElementById('emotionChart').getContext('2d');
//     const labels = data.map(record => new Date(record.timestamp).toLocaleTimeString());
//     const emotions = data.map(record => record.emotion);

//     const chart = new Chart(ctx, {
//         type: 'line', // or 'bar', 'pie', etc., depending on how you want to visualize it
//         data: {
//             labels: labels,
//             datasets: [{
//                 label: 'Emotions Over Time',
//                 data: emotions, // You might need to convert this to a numeric value if using a line or bar chart
//                 // Add more styling as needed
//             }]
//         },
//         options: {
//             scales: {
//                 y: {
//                     beginAtZero: true
//                 }
//             }
//         }
//     });
// }