  attribute vec4 vPosition;
  attribute vec2 v_TexCoord;

  uniform mat4  u_vm;
  uniform mat4  u_pm;

  varying vec2 fTexCoord;

  void
  main()
  {
      gl_PointSize = 2.5;
      gl_Position = u_pm * u_vm * vPosition;
      fTexCoord   = v_TexCoord;
  }
