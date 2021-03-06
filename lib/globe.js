import * as THREE from 'three';

export default class Globe { 
  constructor(scene, container, globeRadius, height, width, shifter) {
    this.width = width;
    this.scene = scene;
    this.height = height;
    this.container = container;
    this.globeRadius = globeRadius;
    this.shifter = shifter
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    this.biggestGlobeSize = 1050;
    this.smallestGlobeSize = 950;
    this.pulseRate = 0.5;
    this.distance = 100000;
    this.distanceTarget = this.biggestGlobeSize;
    this.rotationSpeed = 0.002;
    this.mouse = { x: 0, y: 0 };
    this.rotation = { x: 0, y: 0 };
    this.mouseOnDown = { x: 0, y: 0 };
    this.targetOnDown = { x: 0, y: 0 };
    this.target = { x: Math.PI * 3 / 2, y: Math.PI / 6.0 };
    this.maximize = true
    
    this.pulse = this.pulse.bind(this);
    this.sleep = this.sleep.bind(this);
    this.animate = this.animate.bind(this);
    this.onMouseExit = this.onMouseExit.bind(this);
    this.initialize = this.initialize.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.findClosestLong = this.findClosestLong.bind(this);
    this.lookAtCountry = this.lookAtCountry.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);

    window.addEventListener("resize", this.onWindowResize, false);
    this.container.addEventListener('mousedown', this.onMouseDown, false);

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
          'float intensity = 1.1 - dot( vNormal, vec3( 0.0, 0.0 , 1.75) );',
          'vec3 atmosphere = vec3( 1.0, 0.2, .88 ) * pow( intensity, 1.0 );',
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
    uniforms.texture.value = loader.load('https://notefloat.s3.amazonaws.com/big_world.png');

    material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader
    });

    this.globe = new THREE.Mesh(geometry, material);
    this.globe.rotation.y = Math.PI;
    this.globe.position.y = this.globe.position.y
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
    
  pulse() {
    const delta = this.maximize ? this.pulseRate : - 1 * this.pulseRate;

    this.distanceTarget -= delta;
    if (this.distanceTarget > this.biggestGlobeSize || this.distanceTarget < this.smallestGlobeSize) {
      this.maximize = !this.maximize
    }
  }

  findClosestLong(long) {
    let rotations = Math.floor(this.target.x / (2 * Math.PI))
    return (rotations * 2 * Math.PI) + long
  }

  async lookAtCountry(lat, long) {
    this.target.y = (parseFloat(lat) / 90) * (Math.PI / 2)
    this.target.x = this.findClosestLong(((parseFloat(long) / 180) - 0.51) * Math.PI)

    this.rotationSpeed = 0;
    await this.sleep(4000);
    this.rotationSpeed = 0.002;
  }

  animate() {
    requestAnimationFrame(this.animate);
    this.render();
  }

  render() {
    this.pulse();
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

  onMouseDown(e) {
    this.container.addEventListener('mousemove', this.onMouseMove, false);
    this.container.addEventListener('mouseup', this.onMouseExit, false);
    this.container.addEventListener('mouseout', this.onMouseExit, false);
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

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async onMouseExit(e) {
    this.container.removeEventListener('mousemove', this.onMouseMove, false);
    this.container.removeEventListener('mouseup', this.onMouseExit, false);
    this.container.removeEventListener('mouseout', this.onMouseExit, false);

    await this.sleep(2500); 
    this.rotationSpeed = 0.002;
  }

  onWindowResize(e) {
    this.width = window.innerWidth;
    this.height = window.innerHeight + this.shifter;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width , this.height);
  }
}
