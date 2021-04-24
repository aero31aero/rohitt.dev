varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float time;

void main(){
    vec4 pixel_color = texture2D(uSampler, vTextureCoord);
    float mulx = gl_FragCoord.x * gl_FragCoord.x;
    float muly = gl_FragCoord.y * gl_FragCoord.y;
    vec4 gradient = vec4(
        0.5 * sin(gl_FragCoord.x/100.0 - time + 3.14/2.),
        0.5 + 0.5 * sin(gl_FragCoord.x/100.0 - time ),
        0.9,
        1.0);
    gl_FragColor = pixel_color * abs(gradient);
}