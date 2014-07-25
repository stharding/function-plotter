// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

var canvas,
    gl,
    program,
    points_buff2d,
    points_buff3d,
    tex_coords_buffer,
    vPosition,
    tex_coord_loc,
    tex_loc,
    use_tex_loc,
    cxPosition,
    cyPosition,
    u_vmLoc,
    u_pmLoc,
    minXposition,
    maxXposition,
    minYposition,
    fn_input,
    WIDTH,
    color_body,
    expr_editor,
    tex_img,
    texture,
    data,
    points3d,
    points3d2,
    normal_points,
    normal_points2,
    orig,
    tex_coords,
    normalize_mode  = true,
    points_mode     = false,
    done_tex_config = false,
    render_to_tex   = false,
    last_alpha_x    = 0,
    last_alpha_y    = 0,
    zoom            = mat4(),
    width3d         = 500,
    mode3d          = false,
    vm              = mat4(),
    pm              = mat4(),
    debug           = false,
    setup_done      = false,
    hslMode         = false,
    m_down          = false,
    zoom_step       = 1-1e-1,
    first           = true,
    scale_x         = 2,
    scale_y         = 2,
    cx              = 0,
    cy              = 0,
    ox              = cx,
    oy              = cy,
    minX            = cx - scale_x,
    maxX            = cx + scale_x,
    minY            = cy - scale_y,
    maxY            = cy + scale_y
    eye             = vec3(  0.0,  0.0, -3.0 ),
    at              = vec3(  0.0,  0.0,  0.0 ),
    up              = vec3(  0.0,  1.0,  0.0 );

window.onload       = init;
window.onresize     = init;

function init()
{
    canvas = document.getElementById( "gl-canvas" );

    var maxHeight  = window.innerHeight * 0.9;
    var maxWidth   = canvas.parentNode.clientWidth;
    var dimension  = maxHeight < maxWidth ? maxHeight : maxWidth;
    var pixelRatio = window.devicePixelRatio || 1;

    canvas.style.width  = dimension + "px";
    canvas.style.height = dimension + "px";

    canvas.width  = canvas.clientWidth  * pixelRatio;
    canvas.height = canvas.clientHeight * pixelRatio;
    WIDTH         = canvas.width;

    minX_box = document.getElementById("set_min_x");
    maxX_box = document.getElementById("set_max_x");
    minY_box = document.getElementById("set_min_y");
    maxY_box = document.getElementById("set_max_y");

    window.onkeydown   = handle_on_key_down;
    window.onmousedown = handle_mouse_down;
    window.onmouseup   = function () { m_down = false; };
    canvas.onmousemove = handle_mouse_move;

    canvas.onmousewheel = handleWheel;
    fn_input = document.getElementById( "function_input" );

    clr_editor = ace.edit("clr_input");
    clr_editor.setTheme("ace/theme/dawn");
    clr_editor.getSession().setMode("ace/mode/glsl");
    clr_editor.setOption("maxLines", 105);

    expr_editor = ace.edit("function_input");
    expr_editor.setTheme("ace/theme/dawn");
    expr_editor.getSession().setMode("ace/mode/glsl");

    hlpr_editor = ace.edit("helper_input");
    hlpr_editor.setTheme("ace/theme/dawn");
    hlpr_editor.getSession().setMode("ace/mode/glsl");
    hlpr_editor.setOption("maxLines", 105);

    example = ace.edit("example");
    example.setTheme("ace/theme/dawn")
    example.getSession().setMode("ace/mode/glsl");
    example.setOption("maxLines", 200);
    example.setReadOnly()

    gl = WebGLUtils.setupWebGL( canvas );
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.9, 1, 1, 1.0 );
    gl.enable(gl.DEPTH_TEST);
}

function set_range ()
{
  if (debug) console.log([minX, maxX, minY, maxY]);
  minX = minX_box.value;
  maxX = maxX_box.value;
  minY = minY_box.value;
  maxY = maxY_box.value;
  set_cxy( minX, maxX, minY, maxY );
  render();
  if (debug) console.log([minX, maxX, minY, maxY]);
}

function set_cxy( min_x, max_x, min_y, max_y )
{
  cx = max_x - ((max_x - min_x) / 2);
  cy = max_y - ((max_y - min_y) / 2);
  scale_x = (max_x - min_x) / 2;
  scale_y = (max_y - min_y) / 2;
  setWindow();
}

function render ()
{
  gl.clear     ( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
  gl.uniform1f ( cxPosition      , cx    );
  gl.uniform1f ( cyPosition      , cy    );
  gl.uniform1f ( minXposition    , minX  );
  gl.uniform1f ( maxXposition    , maxX  );
  gl.uniform1f ( minYposition    , minY  );
  gl.uniformMatrix4fv( u_vmLoc, false, flatten( vm ) );
  gl.uniformMatrix4fv( u_pmLoc, false, flatten( pm ) );

  if ( mode3d )
  {
    if (done_tex_config) {
      gl.uniform1i( use_tex_loc, 1 );

      if ( points_mode )
      {
        gl.bindBuffer( gl.ARRAY_BUFFER, tex_coords_buffer );
        gl.vertexAttribPointer( tex_coord_loc, 2, gl.FLOAT, false, 0, 0 );

        gl.bindTexture( gl.TEXTURE_2D, texture );

        gl.bindBuffer( gl.ARRAY_BUFFER , points_buff3d );
        gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.drawArrays( gl.POINTS, 0, points3d.length );
      }
      else
      {
        for (var i = 0; i < all_strips_buffs.length; ++i)
        {
          gl.bindBuffer( gl.ARRAY_BUFFER, strip_coords_buffs[i] );
          gl.vertexAttribPointer( tex_coord_loc, 2, gl.FLOAT, false, 0, 0 );

          gl.bindTexture( gl.TEXTURE_2D, texture );

          gl.bindBuffer( gl.ARRAY_BUFFER, all_strips_buffs[i] );
          gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0);
          gl.drawArrays( gl.TRIANGLE_STRIP, 0, all_strips[i].length );
        }
      }
    }
    else
    {
      console.log( "waiting on texture ... " );
      window.requestAnimFrame( render );
    }
  }
  else
  {
    gl.uniform1i( use_tex_loc, 0 );
    gl.bindBuffer( gl.ARRAY_BUFFER , points_buff2d );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays( gl.TRIANGLE_FAN , 0, points.length );
  }
}


function handleWheel( e )
{
  var s = e.wheelDelta;
  if (mode3d)
  {
    vm = mult( zoom, vm);
    vm = mult( orig, rotations );

    var sign = s > 0 ? 1 : -1;
    zoom = mult( zoom, translate([0,0,sign]) );
    vm = mult( zoom, vm )
    render();
    return false;
  }
  else
  {
    scale_x = s > 0 ? scale_x * 0.95 : scale_x / 0.95;
    scale_y = s > 0 ? scale_y * 0.95 : scale_y / 0.95;
    setWindow();
    render();
    return false;
  }
}

function handle_on_key_down( e )
{
  var x = document.activeElement;
  if ( setup_done      &&
       x != minX_box   &&
       x != maxX_box   &&
       x != minY_box   &&
       x != maxY_box   &&
       x != fn_input   &&
       x != color_body &&
       x != helpers    &&
         !mode3d )
  {
    switch ( e.keyCode )
    { // return false to prevent scrolling via arrow keys
      /* up */ case 38: u_pressed  = true; handle_up    ( e ); return false;
      /* dn */ case 40: d_pressed  = true; handle_down  ( e ); return false;
      /* lf */ case 39: r_pressed  = true; handle_right ( e ); return false;
      /* rt */ case 37: l_pressed  = true; handle_left  ( e ); return false;
    }
  }
}

function handle_up( e )
{
  if ( e.shiftKey ) scale_x *= zoom_step;
  if ( e.shiftKey ) scale_y *= zoom_step;
  else   cy += 0.1 * scale_y;
  setWindow();
  render();
}
function handle_down( e )
{
  if ( e.shiftKey ) scale_x /= zoom_step;
  if ( e.shiftKey ) scale_y /= zoom_step;
  else cy -= 0.1 * scale_y;
  setWindow();
  render();
}
function handle_right( e )
{
  cx += 0.1 * scale_x;
  setWindow();
  render();
}
function handle_left( e )
{
  cx -= 0.1 * scale_x;
  setWindow();
  render();
}

function handle_mouse_down ( e ) {
  m_down = true;
  ox = e.offsetX;
  oy = e.offsetY;
}

var ox, oy;
var rotations = mat4();
function handle_mouse_move ( e )
{
  if ( m_down )
  {
    var dx = ox - e.offsetX;
    var dy = e.offsetY - oy;

    cx += 4 * dx / (canvas.width  / scale_x );
    cy += 4 * dy / (canvas.height / scale_y );

    ox = e.offsetX;
    oy = e.offsetY;

    if (mode3d)
    {
        vm = mult( zoom, orig );
        var val = dx/4;
        var sign = e.offsetX - ox > 0 ? 1 : -1;
        ox = e.offsetX;
        if (e.shiftKey) {
          var tmp = rotate(val * sign, [0, 0, 1]);
          rotations = mult( tmp, rotations );
        }
        else {
          var tmp = rotate(val * sign, [0, 1, 0]);
          rotations = mult( tmp, rotations );
        }

        var val = dy/4;
        var sign = e.offsetY - oy > 0 ? -1 : 1;
        oy = e.offsetY;

        if (e.shiftKey) {
          pm = mult( pm, rotate(val * -0.1 * sign, [1, 0, 0]));
        }
        else {
          var tmp = rotate(val * sign, [1, 0, 0]);
          rotations = mult( tmp, rotations );
        }
        vm = mult( vm, rotations );
        render();
        return false;
    }
    else setWindow();
    render();
    return false;
  }
}

/*
 * Handles the global rotations commanded by the user by sliding the
 * controls under the canvas.
 */
function updateWorldAlpa( value, axis )
{
    switch (axis)
    {
        case 'x':
        var val = value - last_alpha_x;
        last_alpha_x = value;
        pm = mult( pm, rotate(val, [1, 0, 0]));
        break;

        case 'y':
        var val = value - last_alpha_y;
        last_alpha_y = value;
        pm = mult( pm, rotate(val, [0, 1, 0]));
        break;

        case 'z':
        var val = value - last_alpha_z.value;
        last_alpha_z.value = value;
        pm = mult( pm, rotate(val, [0, 0, 1]));
        break;
    }
    render();
}

function set_fShader( f_shader_str, compile )
{
  console.log( "compiling shaders .. " );
  program = initShaders( gl, "vertex.glsl", f_shader_str );
  gl.useProgram( program );

  tex_coords_buffer = gl.createBuffer();
  points_buff2d     = gl.createBuffer();
  points_buff3d     = gl.createBuffer();
  vPosition         = gl.getAttribLocation ( program, "vPosition"  );
  tex_coord_loc     = gl.getAttribLocation ( program, "v_TexCoord" );
  u_vmLoc           = gl.getUniformLocation( program, "u_vm"       );
  u_pmLoc           = gl.getUniformLocation( program, "u_pm"       );
  cxPosition        = gl.getUniformLocation( program, "cx"         );
  cyPosition        = gl.getUniformLocation( program, "cy"         );
  minXposition      = gl.getUniformLocation( program, "minX"       );
  maxXposition      = gl.getUniformLocation( program, "maxX"       );
  minYposition      = gl.getUniformLocation( program, "minY"       );
  widthPosition     = gl.getUniformLocation( program, "width"      );
  hslPosition       = gl.getUniformLocation( program, "hslMode"    );
  tex_loc           = gl.getUniformLocation( program, "texture"    );
  use_tex_loc       = gl.getUniformLocation( program, "use_tex"    );

  points = [
    vec2( -1,  1 ),
    vec2( -1, -1 ),
    vec2(  1, -1 ),
    vec2(  1,  1 )
  ]

  gl.bindBuffer( gl.ARRAY_BUFFER, points_buff2d );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
  gl.enableVertexAttribArray( vPosition );

  gl.uniform1f( widthPosition , canvas.width  );
  gl.uniform1i( hslPosition, hslMode );

  console.log( "Shaders done compiling.")
}

function set_function( compile )
{
  pm = vm = mat4()
  if( arguments.length == 0 ) compile = true;
  mode3d = false;

  var cfn = compile ? clr_editor.getValue() : color_fn_to_float;
  var f_shader = header + hlpr_editor.getValue() + frag_shader_start_1 +
                 cfn + frag_shader_start_2 + expr_editor.getValue() + 
                 frag_shader_end;

  set_fShader( f_shader );
  // Load shaders and initialize attribute buffers
  if (debug) console.log( f_shader_str )
  if (!setup_done)
  {
    minX_label = document.getElementById( "set_min_x" );
    maxX_label = document.getElementById( "set_max_x" );
    minY_label = document.getElementById( "set_min_y" );
    maxY_label = document.getElementById( "set_max_y" );
    helpers    = document.getElementById( "helpers"   );

    setWindow();
  }
  render();
  setup_done = true;
}

function setWindow()
{
  minX = cx - scale_x;
  maxX = cx + scale_x;
  minY = cy - scale_y;
  maxY = cy + scale_y;

  minX_label.value = minX
  maxX_label.value = maxX
  minY_label.value = minY
  maxY_label.value = maxY
}

var header = "                                                               \n\
#ifdef GL_FRAGMENT_PRECISION_HIGH                                            \n\
precision highp float;                                                       \n\
#else                                                                        \n\
precision mediump float;                                                     \n\
#endif                                                                       \n\
                                                                             \n\
uniform float     cx;                                                        \n\
uniform float     cy;                                                        \n\
uniform float     minX;                                                      \n\
uniform float     maxX;                                                      \n\
uniform float     minY;                                                      \n\
uniform float     width;                                                     \n\
uniform int       hslMode;                                                   \n\
uniform int       use_tex;                                                   \n\
uniform sampler2D texture;                                                   \n\
varying vec2      fTexCoord;                                                 \n\
";
var frag_shader_start_1 = "                                                  \n\
vec4 hsvToRgb(float h, float s, float v)                                     \n\
{                                                                            \n\
    float r, g, b;                                                           \n\
                                                                             \n\
    float i = floor(h * 6.0);                                                \n\
    float f = h * 6.0 - i;                                                   \n\
    float p = v * (1.0 - s);                                                 \n\
    float q = v * (1.0 - f * s);                                             \n\
    float t = v * (1.0 - (1.0 - f) * s);                                     \n\
    float j = mod(i, 6.0);                                                   \n\
                                                                             \n\
    if ( j == 0.0 ) return vec4( v, t, p, 1.0 );                             \n\
    if ( j == 1.0 ) return vec4( q, v, p, 1.0 );                             \n\
    if ( j == 2.0 ) return vec4( p, v, t, 1.0 );                             \n\
    if ( j == 3.0 ) return vec4( p, q, v, 1.0 );                             \n\
    if ( j == 4.0 ) return vec4( t, p, v, 1.0 );                             \n\
    if ( j == 5.0 ) return vec4( v, p, q, 1.0 );                             \n\
                                                                             \n\
    return vec4( 1.0, 1.0, 1.0, 1.0 );                                       \n\
}                                                                            \n\
                                                                             \n\
";
var frag_shader_start_2 = "                                                  \n\
void main()                                                                  \n\
{                                                                            \n\
  if ( use_tex == 1 ) gl_FragColor = texture2D( texture, fTexCoord );        \n\
  else {                                                                     \n\
    float ccx = cx;                                                          \n\
    float ccy = cy;                                                          \n\
                                                                             \n\
    float current_scale = (maxX - minX) / width;                             \n\
                                                                             \n\
    // int iteration = 0;                                                    \n\
    float x       = (gl_FragCoord.x * current_scale) + minX;                 \n\
    float y       = (gl_FragCoord.y * current_scale) + minY;                 \n\
    float _z_     =                                                            \
";
var frag_shader_end = "\n;                                                   \n\
    gl_FragColor=( getcolor(_z_));                                           \n\
  }                                                                          \n\
}"

/*
 *  A `color function' which is not intended to be used to render colors.
 *  This function (along with its helpers) actually encode the float value
 *  into a vec4 of bytes which can be reconstructed into a float application
 *  side with a call to gl.readPixels( ..., data ) and a call to
 *  Float32Array( data.buffer ). This overcomes the WebGL limitation of
 *  only being able to pass gl.UNSIGNED_BYTE to readPixels.
 *
 *  NOTE: THIS IS NOT MY CODE!!! This code is copied verbatim from StackOverflow:
 *   http://stackoverflow.com/questions/17981163/webgl-read-pixels-from-floating-point-render-target
 */
var color_fn_to_float = "                                                    \n\
float shift_right (float v, float amt) {                                     \n\
    v = floor(v) + 0.5;                                                      \n\
    return floor(v / exp2(amt));                                             \n\
}                                                                            \n\
float shift_left (float v, float amt) {                                      \n\
    return floor(v * exp2(amt) + 0.5);                                       \n\
}                                                                            \n\
float mask_last (float v, float bits) {                                      \n\
    return mod(v, shift_left(1.0, bits));                                    \n\
}                                                                            \n\
float extract_bits (float num, float from, float to) {                       \n\
    from = floor(from + 0.5); to = floor(to + 0.5);                          \n\
    return mask_last(shift_right(num, from), to - from);                     \n\
}                                                                            \n\
vec4 getcolor (float val) {                                                  \n\
   if (val == 0.0) return vec4(0, 0, 0, 0);                                  \n\
   float sign = val > 0.0 ? 0.0 : 1.0;                                       \n\
   val = abs(val);                                                           \n\
   float exponent = floor(log2(val));                                        \n\
   float biased_exponent = exponent + 127.0;                                 \n\
   float fraction = ((val / exp2(exponent)) - 1.0) * 8388608.0;              \n\
   float t = biased_exponent / 2.0;                                          \n\
   float last_bit_of_biased_exponent = fract(t) * 2.0;                       \n\
   float remaining_bits_of_biased_exponent = floor(t);                       \n\
   float byte4 = extract_bits(fraction, 0.0, 8.0) / 255.0;                   \n\
   float byte3 = extract_bits(fraction, 8.0, 16.0) / 255.0;                  \n\
   float byte2 = (last_bit_of_biased_exponent * 128.0 +                      \n\
                  extract_bits(fraction, 16.0, 23.0)) / 255.0;               \n\
   float byte1 = (sign * 128.0 + remaining_bits_of_biased_exponent) / 255.0; \n\
   return vec4(byte4, byte3, byte2, byte1);                                  \n\
}                                                                            \n\
"

function initShaders(gl, vShaderName, f_shader_str)
{
  function getShader(gl, shaderName, type)
  {
    var shader = gl.createShader(type),
        shaderScript = loadFileAJAX(shaderName);
    if (!shaderScript) {
        alert("Could not find shader source: "+shaderName);
    }
    gl.shaderSource(shader, shaderScript);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
  }

  var vertexShader   = getShader(gl, vShaderName, gl.VERTEX_SHADER),
      fragmentShader = gl.createShader( gl.FRAGMENT_SHADER);
  gl.shaderSource( fragmentShader, f_shader_str );
  gl.compileShader( fragmentShader );
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(fragmentShader));
      return null;
  }
  var program        = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      alert("Could not initialise shaders");
      return null;
  }
  return program;
}

function saveImage( save_local )
{
  if( arguments.length == 0 ) save_local = false;
  
  if ( save_local ){
    var image = document.getElementById( "save_img" );
    image.src = canvas.toDataURL("image/png");
    $(function() {
        $( "#dialog" ).dialog();
      })
  } else {
    console.log( "canvas.style.height == " + canvas.style.height )
    console.log( "canvas.style.width  == " + canvas.style.width  )

    var ch = canvas.style.height;
    var cw = canvas.style.width ;

    var  h = canvas.height;
    var  w = canvas.width;

    canvas.style.width  = 512 + "px";
    canvas.style.height = 512 + "px";

    canvas.width  = 512;
    canvas.height = 512;

    gl.viewport( 0, 0, 512, 512 );
    set_function();
    tex_img = new Image();
    tex_img.src = canvas.toDataURL();
    tex_img.onload = function() {
      texture = gl.createTexture();
      configureTexture( tex_img, texture );
      done_tex_config = true;
    }
    canvas.style.height = ch;
    canvas.style.width  = cw;
    console.log( "canvas.style.height == " + canvas.style.height )
    console.log( "canvas.style.width  == " + canvas.style.width  )

    canvas.height = h;
    canvas.width  = w;
    gl.viewport( 0, 0, canvas.width, canvas.height );
    set_function();    
  }
}

function go3D()
{
  console.log("start 3d setup ...")

  console.log("saving canvas image as texture");
  saveImage();
  console.log("done saving canvas.");

  console.log("getting function values");
  var f_shader_str = header + hlpr_editor.getValue() + frag_shader_start_1 + 
                     color_fn_to_float + frag_shader_start_2 + 
                     expr_editor.getValue() + frag_shader_end;
  set_fShader( f_shader_str );

  data = getPixels();
  set3dPoints( data );
}

function getPixels()
{
  var h = canvas.height;
  var w = canvas.width;
  canvas.height = canvas.width = width3d;
  gl.viewport( 0, 0, canvas.width, canvas.height );
  console.log( "Should skip compilation!!")
  set_function(false)

  data = new Uint8Array( canvas.width * canvas.height * 4 );
  gl.readPixels( 0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, data );
  data = new Float32Array(data.buffer);

  canvas.width  = w;
  canvas.height = h;
  gl.viewport( 0, 0, canvas.width, canvas.height );

  render();
  return data;
}


var max = 0;
function set3dPoints( data )
{
  points3d       = [];
  normal_points  = [];
  normal_points2 = [];
  tex_coords     = [];
  points3d2      = [];
  tex_coords2    = [];
  var l = data.length;
  console.log( "DATA LENGTH: " + l )

  for ( var i = 0; i < l; ++i )
    if ( max < Math.abs(data[i]) && isFinite(data[i]) ) max = Math.abs(data[i]);
  if (max == 0) console.log( "max == " + max + " .... WAT" );
  else {
     if ( !isFinite(data[i]) && i > 0 ) data[i] = data[i-1];
  }

  for ( var i = 0; i <= width3d;   ++i )
  {
    points3d2[i]      = [];
    normal_points2[i] = [];
    tex_coords2[i]    = []
    for ( var j = 0; j <= width3d; ++j )
    {
      var z_val      = data[ width3d * i + j ];
      var z_val_norm = data[ width3d * i + j ] / max;

      points3d.push( vec3(
        affine( 0, j, width3d, -1,  1 ),
        affine( 0, i, width3d, -1,  1 ),
        z_val ) );

      points3d2[i].push( vec3(
        affine( 0, j, width3d, -1,  1 ),
        affine( 0, i, width3d, -1,  1 ),
        z_val ) );

      normal_points.push( vec3(
        affine( 0, j, width3d, -1,  1 ),
        affine( 0, i, width3d, -1,  1 ),
        z_val_norm ) );

      normal_points2[i].push( vec3(
        affine( 0, j, width3d, -1,  1 ),
        affine( 0, i, width3d, -1,  1 ),
        z_val_norm ) );

      tex_coords.push( vec2(
        affine(0, j, width3d, 0, 1),
        affine(0, i, width3d, 1, 0) ) );

      tex_coords2[i].push( vec2(
        affine(0, j, width3d, 0, 1),
        affine(0, i, width3d, 1, 0) ) );
    }
  }
  setup_strips();

  mode3d = true;

  gl.bindBuffer( gl.ARRAY_BUFFER, tex_coords_buffer );
  gl.bufferData( gl.ARRAY_BUFFER, flatten( tex_coords ), gl.STATIC_DRAW );

  console.log( "3d setup done" );
  eye =  vec3(  0.0,  0.0, 11.0 );
  at  =  vec3(  0.0,  0.0, 0.0 );
  pm  = perspective( 10, canvas.width / canvas.height, 0.1, 200 );
  vm  = orig = lookAt( eye, at, up );
  render();
  console.log( "done with 3d render ");
}

var all_strips_buffs   = [];
var all_strips         = [];
var norm_strips        = []
var strip_coords_buffs = [];
var strip_coords       = [];
function setup_strips()
{
  for (var i = 0; i < width3d; ++i)
  {
    all_strips_buffs   [i] = gl.createBuffer();
    strip_coords_buffs [i] = gl.createBuffer();
    all_strips         [i] = [];
    norm_strips        [i] = [];
    strip_coords       [i] = [];
    for (var j = 0; j < width3d; ++j)
    {
      all_strips[i].push(
        points3d2[i    ][j],
        points3d2[i + 1][j]
      );
        norm_strips[i].push(
        normal_points2[i    ][j],
        normal_points2[i + 1][j]
      );
      strip_coords[i].push(
        tex_coords2[i  ][j],
        tex_coords2[i+1][j]
      );
    }
  }
  setPointsBuffData();
}

function setPointsBuffData ()
{
  if ( normalize_mode )
  {
    gl.bindBuffer( gl.ARRAY_BUFFER, points_buff3d );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normal_points), gl.STATIC_DRAW );
    for ( var i = 0; i < all_strips_buffs.length; ++i )
    {
      gl.bindBuffer(gl.ARRAY_BUFFER, all_strips_buffs[i]);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(norm_strips[i]), gl.STATIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, strip_coords_buffs[i]);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(strip_coords[i]), gl.STATIC_DRAW);
    }
  }
  else
  {
    gl.bindBuffer( gl.ARRAY_BUFFER, points_buff3d );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points3d), gl.STATIC_DRAW );
    for ( var i = 0; i < all_strips_buffs.length; ++i )
    {
      gl.bindBuffer(gl.ARRAY_BUFFER, all_strips_buffs[i]);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(all_strips[i]), gl.STATIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, strip_coords_buffs[i]);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(strip_coords[i]), gl.STATIC_DRAW);
    }
  }
}

function configureTexture( image, texture )
{
  gl.bindTexture( gl.TEXTURE_2D, texture );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  gl.generateMipmap( gl.TEXTURE_2D );
  gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
  gl.enableVertexAttribArray( tex_coord_loc );
  console.log( "Texture configuration done." );
}

/*
 * Utility affine function
 *
 * Parameters:
 * -----------
 *     i : floor of input range
 *     x : the position in input range to affine
 *     I : ceiling of input range
 *     o : floor of output range
 *     O : ceiling of output range
 *
 * Returns:
 * --------
 *     x : transformed to appropriate position in output range
 */
function affine( i, x, I, o, O)
{
    return ((x - i) / (I - i)) * (O - o) + o;
}

function clean_data( d )
{
  for ( var i = 0; i < d.length; ++i )
    if ( !isFinite( d[i] ) )
    {
      console.log( "bad data at : " + i );
      return false;
    }
    console.log("data seems clean");
    return true;
}

function togglePoints()
{
  points_mode = !points_mode;
  pm_label = document.getElementById("points_mode");
  pm_label.innerHTML = points_mode ? "Points" : "Triangle Strip";
  render();
}

function toggleNormalize()
{
  normalize_mode = !normalize_mode;
  pm_label = document.getElementById("normalize_mode");
  pm_label.innerHTML = normalize_mode ? "Normalized" : "Not-Normalized";
  setPointsBuffData();
  render();
}
