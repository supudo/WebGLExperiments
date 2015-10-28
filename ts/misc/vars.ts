declare var mat4: any;

module WebGLDemos {

  export class DemoVariables {

    public static availableDemos = [
          ['Select Demo', '', 0, ''],
          ['Stars', 'Stars', 0, ''],
          ['Falling Star', 'FallingStar', 0, ''],
          ['Starfield', 'Starfield', 0, ''],
          ['TexAnim', 'TexAnim', 0, ''],
          ['2D Rotation', 'Rotate2D', 0, ''],
          ['Hypersuit', 'Hypersuit', 1, 'WebGLDemos']
      ];

    public static demoIndex: number = 0;

    public static logCalls: boolean = true;
    public static glDebug: boolean = false;
    public static slowMo: boolean = false;
    public static logInfo: boolean = false;
    public static slowMoFrames: number = 20;
    public static limitLog: boolean = true;
    public static logLength: number = 10000;

    public static gl: any = null;

    public static timeAtLastFrame: any = new Date().getTime();
    public static idealTimePerFrame: number = 1000 / 30;
    public static leftover: number = 0.0;
    public static frames: number = 0;

    public static pMatrix: any = mat4.create();
    public static starsBuffer: any;

    public static STARS_NUM: number = 50;
    public static STARS_FRAME_LIMIT: number = 16;
    public static STARS_MOVEMENT: number = 2;
    public static STARS_SIZE: number = (STARS_NUM > 1 ? 50 : 100);
    public static STARS_VELOCITY: number = 10;
    public static STARS_ROTATION_SPEED: number = 10;
    public static STARS_DO_ROTATION: boolean = true;

    public static stars: any;
    public static starsVertices: any;

  }

}