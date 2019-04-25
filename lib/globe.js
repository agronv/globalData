import * as THREE from 'three';

export default class Globe { 
  constructor(scene, container, globeRadius, height, width) {
    this.width = width;
    this.scene = scene;
    this.height = height;
    this.container = container;
    this.globeRadius = globeRadius;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    this.distance = 100000;
    this.distanceTarget = 1100;
    this.rotationSpeed = 0.002;
    this.mouse = { x: 0, y: 0 };
    this.rotation = { x: 0, y: 0 };
    this.mouseOnDown = { x: 0, y: 0 };
    this.targetOnDown = { x: 0, y: 0 };
    this.target = { x: Math.PI * 3 / 2, y: Math.PI / 6.0 };
    
    this.zoom = this.zoom.bind(this);
    this.animate = this.animate.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
    this.initialize = this.initialize.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseWheel = this.onMouseWheel.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);

    window.addEventListener("resize", this.onWindowResize, false);
    this.container.addEventListener('mousedown', this.onMouseDown, false);
    this.container.addEventListener('mousewheel', this.onMouseWheel, false);

    this.initialize(); 
  }

  initialize() {
    let Shaders = {
      'earth': {
        uniforms: {
          'texture': { type: 't', value: null }
        },
        vertexShader: [
          'varying vec3 vNormal;',
          'varying vec2 vUv;',
          'void main() {',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
          'vNormal = normalize( normalMatrix * normal );',
          'vUv = uv;',
          '}'
        ].join('\n'),
        fragmentShader: [
          'uniform sampler2D texture;',
          'varying vec3 vNormal;',
          'varying vec2 vUv;',
          'void main() {',
          'vec3 diffuse = texture2D( texture, vUv ).xyz;',
          'float intensity = 1.35 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
          'vec3 atmosphere = vec3( 0.9, 0.60, .90 ) * pow( intensity, 10.0 );',
          'gl_FragColor = vec4( diffuse + atmosphere, 1.0 );',
          '}'
        ].join('\n')
      },
      'atmosphere': {
        vertexShader: [
          'varying vec3 vNormal;',
          'void main() {',
          'vNormal = normalize( normalMatrix * normal );',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
          '}'
        ].join('\n'),
        fragmentShader: [
          'varying vec3 vNormal;',
          'void main() {',
          'float intensity = pow( 1.3 - dot( vNormal, vec3( 1.0, 1.0, 1.0 ) ), 2.0 );',
          'gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * intensity;',
          '}'
        ].join('\n')
      }
    };

    let geometry, loader, material, shader, uniforms, halo;

    this.camera = new THREE.PerspectiveCamera(30, this.width / this.height, 1, 10000);
    this.camera.position.z = 10000;

    geometry = new THREE.SphereGeometry(this.globeRadius, 100, 100);
    loader = new THREE.TextureLoader();
    shader = Shaders.earth;
    uniforms = THREE.UniformsUtils.clone(shader.uniforms);
    uniforms.texture.value = loader.load('https://s3.amazonaws.com/notefloat-dev/earth-countries.png');

    material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader
    });

    this.globe = new THREE.Mesh(geometry, material);
    this.globe.rotation.y = Math.PI;
    this.scene.add(this.globe);

    shader = Shaders.atmosphere;
    uniforms = THREE.UniformsUtils.clone(shader.uniforms);

    material = new THREE.ShaderMaterial({
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true
    });

    halo = new THREE.Mesh(geometry, material);
    halo.scale.set(1.2, 1.2, 1.2);
    this.scene.add(halo);

    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
  }
    
  zoom(delta) {
    this.distanceTarget -= delta;
    delta *= 0.9;
    this.distanceTarget = this.distanceTarget > 1100 ? 1100 : this.distanceTarget;
    this.distanceTarget = this.distanceTarget < 300 ? 300 : this.distanceTarget;
  }

  animate() {
    requestAnimationFrame(this.animate);
    this.render();
  }

  render() {
    this.zoom(0);
    this.distance += (this.distanceTarget - this.distance) * 0.05;

    this.target.x += this.rotationSpeed;
    this.rotation.x += (this.target.x - this.rotation.x) * 0.1;
    this.rotation.y += (this.target.y - this.rotation.y) * 0.1;
    this.camera.position.x = this.distance * Math.sin(this.rotation.x) * Math.cos(this.rotation.y);
    this.camera.position.y = this.distance * Math.sin(this.rotation.y);
    this.camera.position.z = this.distance * Math.cos(this.rotation.x) * Math.cos(this.rotation.y);

    this.camera.lookAt(this.globe.position);
    this.renderer.render(this.scene, this.camera);
  }

  onMouseWheel(e) {
    this.zoom(e.wheelDeltaY * 0.3);
  }

  onMouseDown(e) {
    this.container.addEventListener('mousemove', this.onMouseMove, false);
    this.container.addEventListener('mouseup', this.onMouseUp, false);
    this.container.addEventListener('mouseout', this.onMouseOut, false);
    this.rotationSpeed = 0;
    this.mouseOnDown.x = - e.clientX;
    this.mouseOnDown.y = e.clientY;
    this.targetOnDown.x = this.target.x;
    this.targetOnDown.y = this.target.y;
  }

  onMouseMove(e) {
    this.mouse.x = - e.clientX;
    this.mouse.y = e.clientY;

    this.target.x = this.targetOnDown.x + (this.mouse.x - this.mouseOnDown.x) * 0.015;
    this.target.y = this.targetOnDown.y + (this.mouse.y - this.mouseOnDown.y) * 0.015;
    this.target.y = this.target.y > Math.PI / 2 ? Math.PI / 2 : this.target.y;
    this.target.y = this.target.y < - Math.PI / 2 ? - Math.PI / 2 : this.target.y;
  }

  onMouseUp(e) {
    this.rotationSpeed = 0.002;
    this.container.removeEventListener('mousemove', this.onMouseMove, false);
    this.container.removeEventListener('mouseup', this.onMouseUp, false);
    this.container.removeEventListener('mouseout', this.onMouseOut, false);
  }

  onMouseOut(e) {
    this.rotationSpeed = 0.002;
    this.container.removeEventListener('mousemove', this.onMouseMove, false);
    this.container.removeEventListener('mouseup', this.onMouseUp, false);
    this.container.removeEventListener('mouseout', this.onMouseOut, false);
  }

  onWindowResize(e) {
    this.width = window.innerWidth;
    this.height = window.innerHeight - 5;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width , this.height);
  }
}