attribute vec4 vPosition;
attribute vec2 v_TexCoord;

uniform mat4  u_vm;
uniform mat4  u_pm;
uniform float point_size;

varying vec2 fTexCoord;

void
main()
{
    gl_PointSize = point_size;
    gl_Position = u_pm * u_vm * vPosition;
    fTexCoord   = v_TexCoord;
}
