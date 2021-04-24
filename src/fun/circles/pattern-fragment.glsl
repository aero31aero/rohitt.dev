varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float time;

void main(){
    vec4 pixel_color = texture2D(uSampler, vTextureCoord);
    vec4 gradient = vec4(
        0.9 * sin(gl_FragCoord.y/1000.0 + time*2.),
        0.9 * sin(gl_FragCoord.y/1000.0 + time*2.),
        0.05 * sin(gl_FragCoord.y/1000.0 + time*2.),
        0.5);
    gl_FragColor = pixel_color * gradient;
}