import $ from 'jquery';
var manager = function () {
    // Audio analyser resources
    var audio = {};
    const video = $('video')[0];
    const video_file = require('./buildings/input/main.mp4');
    video.src = '/' + video_file.default;
    audio.domElement = $('audio')[0];
    const music = require('./buildings/input/main-1.mp3');
    audio.domElement.src = '/' + music.default;
    let audiocontext = AudioContext || webkitAudioContext;
    audio.context = new audiocontext();
    audio.analyser = audio.context.createAnalyser();
    audio.analyser.fftSize = 256;
    audio.analyser.smoothingTimeConstant = 1;
    audio.dataArray = new Uint8Array(audio.analyser.frequencyBinCount);
    audio.gainNode = audio.context.createGain();
    audio.buffer = audio.context.createMediaElementSource(audio.domElement);
    audio.init = function () {
        audio.buffer.connect(audio.gainNode);
        audio.gainNode.connect(audio.analyser);
        audio.analyser.connect(audio.context.destination);
    };
    audio.update = function () {
        audio.analyser.getByteTimeDomainData(audio.dataArray);
        var sum = 0;
        for (let i = 0; i < 5; i++) {
            sum += audio.dataArray[i];
        }
        sum /= 5;
        audio.high = sum;
    };
    return {
        getAudio: function () {
            return audio;
        },
    };
};

export default manager;
