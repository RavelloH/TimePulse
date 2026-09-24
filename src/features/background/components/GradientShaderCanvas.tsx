import { useEffect, useRef } from 'react';

export type GradientCircle = {
  id: number;
  x: number;
  y: number;
  size: number;
  driftX: number;
  driftY: number;
  color: string;
  blur: number;
  opacity: number;
};

type Color = [number, number, number];

type ColorTransition = {
  from: Color;
  to: Color;
  startedAt: number;
  duration: number;
};

type CircleMotion = {
  initialVelocityX: number;
  initialVelocityY: number;
  startedAt: number;
};

interface GradientShaderCanvasProps {
  circles: GradientCircle[];
  onUnavailable: () => void;
}

export const GRADIENT_CIRCLE_COUNT = 8;
const COLOR_TRANSITION_MS = 2500;
const INITIAL_VELOCITY_MIN = 180;
const INITIAL_VELOCITY_MAX = 480;
const INITIAL_VELOCITY_DECAY_SECONDS = 1.1;

function randomInitialVelocity(): number {
  const magnitude = INITIAL_VELOCITY_MIN + Math.random() * (INITIAL_VELOCITY_MAX - INITIAL_VELOCITY_MIN);
  return (Math.random() < 0.5 ? -1 : 1) * magnitude;
}

function pingPongProgress(elapsedSeconds: number, durationSeconds: number): number {
  const phase = (elapsedSeconds % (durationSeconds * 2)) / durationSeconds;
  return phase <= 1 ? phase : 2 - phase;
}

function reflectWithinViewport(position: number, extent: number): number {
  // Reflect the glow center at viewport edges so the startup impulse never sends it out of view.
  const reflected = ((position % (extent * 2)) + extent * 2) % (extent * 2);
  return reflected <= extent ? reflected : extent * 2 - reflected;
}

const vertexShaderSource = `#version 300 es
in vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const fragmentShaderSource = `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_pixelRatio;
uniform float u_time;
uniform float u_introDuration;
uniform vec4 u_geometry[${GRADIENT_CIRCLE_COUNT}];
uniform vec3 u_motion[${GRADIENT_CIRCLE_COUNT}];
uniform vec4 u_colors[${GRADIENT_CIRCLE_COUNT}];

out vec4 outColor;

void main() {
  float aspect = u_resolution.x / u_resolution.y;
  vec2 position = gl_FragCoord.xy / u_resolution.y;
  vec4 accumulated = vec4(0.0);
  float entranceProgress = min(1.0, u_time / u_introDuration);
  float entrance = 1.0 - pow(1.0 - entranceProgress, 2.0);

  for (int i = 0; i < ${GRADIENT_CIRCLE_COUNT}; i++) {
    vec4 geometry = u_geometry[i];
    vec3 motion = u_motion[i];
    vec4 color = u_colors[i];

    float left = motion.x;
    float top = motion.y;
    float diameter = geometry.x;
    vec2 center = vec2(
      (left + diameter * 0.5) * aspect / 100.0,
      1.0 - top / 100.0 - diameter * aspect / 200.0
    );
    float radius = diameter * aspect / 200.0;
    float blur = max(geometry.y * u_pixelRatio / u_resolution.y, 0.00001);
    float distanceFromCenter = distance(position, center);
    float softness = 1.0 - smoothstep(radius - blur, radius + blur * 2.0, distanceFromCenter);
    float alpha = clamp(color.a * motion.z * softness * entrance, 0.0, 1.0);
    vec3 source = color.rgb * alpha;

    accumulated.rgb = source + accumulated.rgb * (1.0 - alpha);
    accumulated.a = alpha + accumulated.a * (1.0 - alpha);
  }

  outColor = accumulated;
}`;

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('无法创建 WebGL shader');

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || '未知 shader 编译错误';
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
}

function parseColor(value: string): { color: Color; alpha: number } {
  const channels = value.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  if (channels.length < 3) return { color: [14 / 255, 165 / 255, 233 / 255], alpha: 0.5 };

  return {
    color: [
      Math.min(255, Math.max(0, channels[0])) / 255,
      Math.min(255, Math.max(0, channels[1])) / 255,
      Math.min(255, Math.max(0, channels[2])) / 255,
    ],
    alpha: channels.length > 3 ? Math.min(1, Math.max(0, channels[3])) : 1,
  };
}

function colorAt(transition: ColorTransition, now: number): Color {
  if (transition.duration <= 0) return transition.to;
  const progress = Math.min(1, Math.max(0, (now - transition.startedAt) / transition.duration));
  const eased = 1 - Math.pow(1 - progress, 3);
  return [
    transition.from[0] + (transition.to[0] - transition.from[0]) * eased,
    transition.from[1] + (transition.to[1] - transition.from[1]) * eased,
    transition.from[2] + (transition.to[2] - transition.from[2]) * eased,
  ];
}

export default function GradientShaderCanvas({
  circles,
  onUnavailable,
}: GradientShaderCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const circlesRef = useRef(circles);
  const positionsRef = useRef<CircleMotion[]>([]);
  const colorTransitionsRef = useRef<ColorTransition[]>([]);
  circlesRef.current = circles;
  const positionSignature = circles
    .map(circle => `${circle.id}:${circle.x}:${circle.y}:${circle.driftX}:${circle.driftY}`)
    .join('|');

  useEffect(() => {
    const currentCircles = circlesRef.current;
    const startedAt = performance.now();
    positionsRef.current = currentCircles.map(() => ({
      initialVelocityX: randomInitialVelocity(),
      initialVelocityY: randomInitialVelocity(),
      startedAt,
    }));
  }, [positionSignature]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
    });
    if (!gl) {
      onUnavailable();
      return;
    }

    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    let frameId: number | null = null;
    let pixelRatio = 1;
    const startedAt = performance.now();
    const geometry = new Float32Array(GRADIENT_CIRCLE_COUNT * 4);
    const motion = new Float32Array(GRADIENT_CIRCLE_COUNT * 3);
    const colors = new Float32Array(GRADIENT_CIRCLE_COUNT * 4);

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      onUnavailable();
    };

    try {
      const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
      const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
      program = gl.createProgram();
      if (!program) throw new Error('无法创建 WebGL program');

      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || '未知 WebGL program 链接错误');
      }

      buffer = gl.createBuffer();
      if (!buffer) throw new Error('无法创建 WebGL buffer');

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.useProgram(program);
      const positionLocation = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
      const pixelRatioLocation = gl.getUniformLocation(program, 'u_pixelRatio');
      const timeLocation = gl.getUniformLocation(program, 'u_time');
      const introDurationLocation = gl.getUniformLocation(program, 'u_introDuration');
      const geometryLocation = gl.getUniformLocation(program, 'u_geometry[0]');
      const motionLocation = gl.getUniformLocation(program, 'u_motion[0]');
      const colorsLocation = gl.getUniformLocation(program, 'u_colors[0]');

      if (
        positionLocation < 0 || !resolutionLocation || !pixelRatioLocation || !timeLocation ||
        !introDurationLocation || !geometryLocation || !motionLocation || !colorsLocation
      ) {
        throw new Error('无法获取 WebGL uniforms');
      }

      const resize = () => {
        const bounds = canvas.getBoundingClientRect();
        if (bounds.width <= 0 || bounds.height <= 0) return;

        // Blurred gradients do not need full device-pixel resolution; cap DPR to bound fill cost.
        const maxDimensionRatio = 1920 / Math.max(bounds.width, bounds.height);
        pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5, maxDimensionRatio);
        const width = Math.max(1, Math.round(bounds.width * pixelRatio));
        const height = Math.max(1, Math.round(bounds.height * pixelRatio));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          gl.viewport(0, 0, width, height);
        }
      };

      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);
      window.addEventListener('resize', resize);
      resize();

      const draw = (now: number) => {
        frameId = null;
        if (document.hidden) return;
        frameId = window.requestAnimationFrame(draw);

        const currentCircles = circlesRef.current;
        const currentPositions = positionsRef.current;
        const elapsed = now - startedAt;
        const colorTransitions = colorTransitionsRef.current;
        const duration = 20;
        const viewportWidth = Math.max(window.innerWidth, 1);
        const viewportHeight = Math.max(window.innerHeight, 1);

        for (let index = 0; index < GRADIENT_CIRCLE_COUNT; index += 1) {
          const circle = currentCircles[index];
          const offset4 = index * 4;
          const offset3 = index * 3;

          if (!circle) {
            geometry.fill(0, offset4, offset4 + 4);
            motion.fill(0, offset3, offset3 + 3);
            colors.fill(0, offset4, offset4 + 4);
            continue;
          }

          const position = currentPositions[index];
          const motionElapsed = position ? Math.max(0, (now - position.startedAt) / 1000) : 0;
          const decayProgress = 1 - Math.exp(-motionElapsed / INITIAL_VELOCITY_DECAY_SECONDS);
          const loopProgress = pingPongProgress(motionElapsed, duration);
          const impulseX = position
            ? position.initialVelocityX * INITIAL_VELOCITY_DECAY_SECONDS * decayProgress
            : 0;
          const impulseY = position
            ? position.initialVelocityY * INITIAL_VELOCITY_DECAY_SECONDS * decayProgress
            : 0;
          const radiusPixels = circle.size * viewportWidth / 200;
          const centerX = reflectWithinViewport(
            (circle.x + circle.size / 2) * viewportWidth / 100 + impulseX + circle.driftX * duration * loopProgress,
            viewportWidth,
          );
          const centerY = reflectWithinViewport(
            circle.y * viewportHeight / 100 + radiusPixels + impulseY + circle.driftY * duration * loopProgress,
            viewportHeight,
          );
          geometry[offset4] = circle.size;
          geometry[offset4 + 1] = circle.blur;
          geometry[offset4 + 2] = 0;
          geometry[offset4 + 3] = 0;
          motion[offset3] = (centerX - radiusPixels) * 100 / viewportWidth;
          motion[offset3 + 1] = (centerY - radiusPixels) * 100 / viewportHeight;
          motion[offset3 + 2] = circle.opacity;

          const parsed = parseColor(circle.color);
          let transition = colorTransitions[index];
          if (!transition) {
            transition = {
              from: parsed.color,
              to: parsed.color,
              startedAt: now,
              duration: 0,
            };
            colorTransitions[index] = transition;
          } else if (
            transition.to[0] !== parsed.color[0] ||
            transition.to[1] !== parsed.color[1] ||
            transition.to[2] !== parsed.color[2]
          ) {
            transition = {
              from: colorAt(transition, now),
              to: parsed.color,
              startedAt: now,
              duration: COLOR_TRANSITION_MS,
            };
            colorTransitions[index] = transition;
          }

          const color = colorAt(transition, now);
          colors[offset4] = color[0];
          colors[offset4 + 1] = color[1];
          colors[offset4 + 2] = color[2];
          colors[offset4 + 3] = parsed.alpha;
        }

        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
        gl.uniform1f(pixelRatioLocation, pixelRatio);
        gl.uniform1f(timeLocation, elapsed / 1000);
        gl.uniform1f(introDurationLocation, 0.8);
        gl.uniform4fv(geometryLocation, geometry);
        gl.uniform3fv(motionLocation, motion);
        gl.uniform4fv(colorsLocation, colors);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      };

      const scheduleDraw = () => {
        if (!document.hidden && frameId === null) {
          frameId = window.requestAnimationFrame(draw);
        }
      };
      const handleVisibilityChange = () => {
        if (document.hidden && frameId !== null) {
          window.cancelAnimationFrame(frameId);
          frameId = null;
        } else {
          scheduleDraw();
        }
      };

      canvas.addEventListener('webglcontextlost', handleContextLost);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      scheduleDraw();

      return () => {
        if (frameId !== null) window.cancelAnimationFrame(frameId);
        resizeObserver.disconnect();
        window.removeEventListener('resize', resize);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        canvas.removeEventListener('webglcontextlost', handleContextLost);
        if (buffer) gl.deleteBuffer(buffer);
        if (program) gl.deleteProgram(program);
      };
    } catch (error) {
      console.warn('WebGL 背景初始化失败，回退到 CSS 渐变:', error);
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      onUnavailable();
    }
  }, [onUnavailable]);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block size-full" />;
}
