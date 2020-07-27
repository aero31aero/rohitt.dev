import './index.css';
import path from './path';
const audio = new Audio('/' + require('./audio.mp3').default);
$(document).ready(() => {
    $('#play').on('click', function () {
        $('.grid').hide();
        $('.info').show();
        audio.play();
        path();
    });
});
