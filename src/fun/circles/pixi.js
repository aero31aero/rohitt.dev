import * as PIXI from 'pixi.js';
import { Circle } from 'pixi.js';
const fragment_shader = require('./pattern-fragment.glsl');
const background_fragment_shader = require('./background-fragment.glsl');
const line_fragment_shader = require('./line-fragment.glsl');
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.LINEAR;
PIXI.settings.RESOLUTION = window.devicePixelRatio;
let _ = {
    width: window.innerWidth,
    height: window.innerHeight,
};

var uniforms = {};
uniforms.time = 0.0;

const app = new PIXI.Application({
    width: _.width,
    height: _.height,
    antialias: true,
    resizeTo: window,
});
let circles = [];
let lines = [];

const add_circle = (x, y, radius) => {
    circles.push({
        x,
        y,
        radius,
    });
};

const add_line = (n1, n2) => {
    lines.push({
        n1,
        n2,
    });
};

let displacementSprite;
let displacementSpriteBackground;

add_circle(0.1, 0.3, 0.4);
add_circle(0.4, 0.2, 0.5);
add_circle(0.15, 0.6, 0.5);
add_circle(0.5, 0.5, 0.6);
add_circle(0.6, 0.25, 0.7);
add_circle(0.8, 0.7, 0.4);
add_circle(0.3, 0.8, 0.7);
add_circle(0.9, 0.3, 0.5);

add_line(0, 1);
add_line(0, 2);
add_line(2, 3);
add_line(3, 6);
add_line(4, 7);
add_line(6, 5);
add_line(5, 7);
add_line(3, 4);
add_line(1, 4);
add_line(3, 5);

const make_circle = (circle) => {
    let { x, y, radius } = circle;
    const min = Math.min(_.width, _.height);
    const max = Math.max(_.width, _.height);
    x = x * min;
    y = y * min;
    const diff = (max - min) / 2;
    if (_.width == max) {
        x += diff;
    } else {
        y += diff;
    }

    radius = radius * 0.4; // scale the image;
    if (min < 700) {
        radius = radius * 0.6;
    }
    const sprite = new PIXI.Sprite(app.loader.resources.circle.texture);
    sprite.scale.set(radius, radius);
    sprite.x = x;
    sprite.y = y;
    sprite.anchor.set(0.5);

    const shader = new PIXI.Filter('', line_fragment_shader, uniforms);
    const displacement_filter = new PIXI.filters.DisplacementFilter(
        displacementSprite
    );
    sprite.filters = [shader, displacement_filter];

    app.stage.addChild(sprite);
    return sprite;
};

const make_lines = (n1, n2) => {
    const c1 = circles[n1];
    const c2 = circles[n2];
    const line = new PIXI.Graphics();
    const pattern = new PIXI.Graphics();

    const slope = (c1.sprite.y - c2.sprite.y) / (c1.sprite.x - c2.sprite.x);
    const normal_slope = -1 / slope;
    const normal_sin = Math.sin(Math.atan(normal_slope));
    const normal_cos = Math.cos(Math.atan(normal_slope));

    const line_at_dist = (dist, slope_delta, target) => {
        const x1 = dist * (normal_sin + slope_delta) + c1.sprite.x;
        const y1 = dist * (normal_cos + slope_delta) + c1.sprite.y;
        const x2 = dist * (normal_sin - slope_delta) + c2.sprite.x;
        const y2 = dist * (normal_cos - slope_delta) + c2.sprite.y;
        target.moveTo(x1, y1);
        target.lineTo(x2, y2);
    };

    for (let i = -50; i <= 50; i++) {
        const dist = i * Math.min(c1.radius, c2.radius) * 60;
        const delta = (Math.random() * 3.14) / 4;
        pattern.lineStyle(0.5 + Math.random() * 2, 0xffffff, 0.3);
        line_at_dist(dist, delta, pattern);
    }

    for (let i = -5; i <= 5; i++) {
        const dist = i * Math.min(c1.radius, c2.radius) * 20;
        const delta = (6 - Math.abs(i)) * 0.1;
        line.lineStyle(0.5 + Math.random() * 3, 0xffffff, 1);
        line_at_dist(dist, delta, line);
    }

    // shading
    const foreground_shader = new PIXI.Filter(
        '',
        line_fragment_shader,
        uniforms
    );
    const background_shader = new PIXI.Filter('', fragment_shader, uniforms);
    const displacement_filter = new PIXI.filters.DisplacementFilter(
        displacementSprite
    );
    const displacement_filter_background = new PIXI.filters.DisplacementFilter(
        displacementSpriteBackground
    );
    line.filters = [foreground_shader, displacement_filter];
    pattern.filters = [background_shader, displacement_filter_background];

    // insert inro stage
    const index = app.stage.getChildIndex(circles[0].sprite);
    app.stage.addChildAt(line, index);
    app.stage.addChildAt(pattern, 3);
    return {
        sprite: line,
        pattern: pattern,
        circles: [c1, c2],
    };
};

const startup = () => {
    displacementSprite = new PIXI.Sprite(app.loader.resources.cloud.texture);
    displacementSpriteBackground = new PIXI.Sprite(
        app.loader.resources.cloud.texture
    );
    displacementSprite.texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
    displacementSpriteBackground.texture.baseTexture.wrapMode =
        PIXI.WRAP_MODES.REPEAT;
    app.stage.addChild(displacementSprite);
    app.stage.addChild(displacementSpriteBackground);
    const sprite = new PIXI.Sprite(app.loader.resources.background.texture);
    sprite.x = _.width / 2;
    sprite.y = _.height / 2;
    sprite.anchor.set(0.5);
    const shader = new PIXI.Filter('', background_fragment_shader, uniforms);
    sprite.filters = [shader];
    app.stage.addChild(sprite);
    circles = circles.map((c) => {
        c.sprite = make_circle(c);
        delete c.x;
        delete c.y;
        return c;
    });
    lines = lines.map((l) => {
        l = make_lines(l.n1, l.n2);
        return l;
    });
};

const main = () => {
    document.body.appendChild(app.view);
    const circle_path = require('./circle.png');
    const cloud_path = require('./clouds.jpg');
    const snow_path = require('./background.jpg');
    app.loader
        .add('background', `/${snow_path.default}`)
        .add('circle', `/${circle_path.default}`)
        .add('cloud', `/${cloud_path.default}`)
        .load(startup);
};

app.ticker.add((delta) => {
    // use delta to create frame-independent transform
    uniforms.time += 0.01 * delta;
    if (displacementSprite) {
        const scale = 0.5;
        displacementSprite.x += scale * delta;
        displacementSprite.y += scale * delta;
        displacementSpriteBackground.x += (scale * delta) / 2;
        displacementSpriteBackground.y += (scale * delta) / 2;
    }
});

export { main };
