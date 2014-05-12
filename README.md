## Function Plotter Documentation ##

### Overview ###

The function plotter plots functions of the form `z = f(x, y)`.
The plotter has two fundamental modes: 2d mode and 3d mode.

##### 2D Mode: #####

In 2d mode, the `z = f(x, y)` function is rendered using a (user definable)
color map which depends on the `z` value of the function, and the `x` and `y`
values are based on the `(x, y)` pixel coordinates of the canvas.

The user is free to explore the function in many ways in 2d mode. The domain
of the function can be changed by panning/zooming with the mouse. Clicking
and dragging will pan the plot view and the mouse wheel will change the scale
of the plot (effecting either a zoom in or out depending on the direction of
the wheel movement). If preferred, panning and zooming can be accomplished via
the arrow keys on the keyboard. (hold the shift key for zooming.) The user can
tweak the RGB color mapping by editing the color function on the page. Most
importantly, the user can edit the function to be plotted.

##### 3D Mode: #####

In 3d mode, the user can no longer change the color mapping or the expression
to be evaluated (all such edits should be completed in 2d mode). Instead, the
user is free to explore the plotted function in other ways. In 3d mode, clicking
and dragging the mouse will rotate the plotted function in 3d space. The mouse
wheel zooms into our out of the 3d plot.

### Usage ###

The plotter consists primarily of a canvas area, a color function
editor, a helper function editor, and an expression editor.

**NOTE**: Each of the editable areas will end up modifying the fragment shader.
as such, all of the `GLSL` language is available to implement these functions.
On the other hand, the user is also limited by the `GLSL` language
peculiarities. For example, `GLSL` provides no implicit casting of numeric
literals. e.g. the following expression will cause a compilation error:
`1 + 1.0`! Since almost all of the builtin `GLSL` functions take `float` typed
input, it is probably best to avoid `int` variables and integer constants.


##### Color function: #####

A `GLSL` function named `getcolor()` must be defined. The following definition
is provided as a default:

```java
vec4 getcolor(float z)
{
  float r = z + z > 1.0 ? 1.0 / (z + z) : z + z;
  float g = z     > 1.0 ? 1.0 / (z * z) : z;
  float b = z     > 1.0 ? 1.0 /  z      : z * z;
  return vec4(r, g, b, 1.0);
}
```
##### Helper function(s): #####

An editor is provided so that the user can implement any helper functions they
would like for use in the expression evaluator area. This allows for the use
of functions above and beyond the builtin `GLSL` functions. See the example
section for some interesting uses of the helper function editor.

##### Expression Editor: #####

An editor box is provided so the user can input an expression to be plotted.
the expression _must_ be in terms of the (internally declared) variables `x` and
`y`. A default expression is provided:
```java
sin( x*x + y*y )
```
However, the user is encouraged to change this expression and plot more interesting
functions.

### How it works: ###

### Examples: ###

```java
vec4 getcolor(float z)
{
  if (z == MAX - 1.0) return vec4( 0,0,0,1 );
  z = z/MAX;
  float r = z + z > 1.0 ? 1.0 / (z + z) : z + z;
  float g = z     > 1.0 ? 1.0 / (z * z) : z;
  float b = z     > 1.0 ? 1.0 / z       : z * z;
  if ( hslMode == 1 ) return hsvToRgb( z, 0.6, 0.5 );
  else return vec4(r, g, b, 1.0);
}
```

```java
#define MAX 100.0
float mandelbrot(float fx, float fy) {
  float iteration  = 0.0;
  float x          = 0.0;
  float y          = 0.0;
  float xtemp      = 0.0;

  for ( float i = 0.0; i < MAX; ++i  )
  {
    if ( sqrt(x * x + y * y) <= 4.0 ) {
      xtemp = x * x - y * y + fx;
      y = 2.0 * x * y + fy;
      x = xtemp;
      iteration = i;
    }
    else{ break; }
  }
  return iteration;
}
```

```java
#define MAX 100.0
float julia( float x, float y ) {
  float newRe = x;
  float newIm = y;
  float oldRe, oldIm, cRe, cIm;
  cRe = -0.7;
  cIm = 0.27015;
  float z = 0.0;
  for(float i = 0.0; i < max; i++)
  {
    oldRe = newRe;
    oldIm = newIm;
    newRe = oldRe * oldRe - oldIm * oldIm + cRe;
    newIm = 2.0 * oldRe * oldIm + cIm;
    if((newRe * newRe + newIm * newIm) > 4.0) break;
    z = i;
  }
  return z;
}
```
