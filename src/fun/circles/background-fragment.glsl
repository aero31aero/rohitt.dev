varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float time;

void main(){
    vec4 pixel_color = texture2D(uSampler, vTextureCoord);
    vec4 gradient = vec4(
        0.4 * sin(gl_FragCoord.x/1000.0 - time),
        0.4,
        0.1 * sin(gl_FragCoord.x/1000.0 - time + 3.14/2.),
        1.);
    gl_FragColor = pixel_color * abs(gradient);
}