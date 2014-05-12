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
