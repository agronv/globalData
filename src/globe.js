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
    this.distance = 1000;
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
        'uniform sampler2D globeTexture;',
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0 , 1.5) );',
          'vec3 atmosphere = vec3( 0.8 , 0.2, 0.8 ) * pow( intensity, 1.0 );',
          'gl_FragColor = vec4( atmosphere + texture2D( globeTexture, vUv ).xyz, 1.0 );',
        '}'
      ].join('\n')
  };

    this.camera = new THREE.PerspectiveCamera(30, this.width / this.height, 1, 10000);
    let group = new THREE.Group();

    /////////////////// GLOBE ////////////////////////////
    this.globe = new THREE.Mesh(
      new THREE.SphereGeometry(this.globeRadius, 100, 100),
      new THREE.ShaderMaterial({
        vertexShader: Shaders.vertexShader,
        fragmentShader: Shaders.fragmentShader,
        uniforms: {
          globeTexture: {
            value: new THREE.TextureLoader().load("https://notefloat.s3.amazonaws.com/big_world.png")
          }
        }
      }));
    // without this orientation arcs will not be mapped correctly
    this.globe.rotation.y = Math.PI;
    group.add(this.globe);
    
    /////////////////// STARS ////////////////////////////
    let starGeometry = new THREE.BufferGeometry();
    let starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5
    });

    let starVertices = [];
    for (let i=0; i<50000; i++) {
      let x = (Math.random() -0.5) * 3000;
      let y = (Math.random() -0.5) * 3000;
      let z = (Math.random() -0.5) * 3000;
      starVertices.push(x, y, z);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3))
    let stars = new THREE.Points(starGeometry, starMaterial);
    group.add(stars);

    this.scene.add(group);
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
    let rotations = Math.round(this.target.x / (2 * Math.PI))
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
    console.log(1);
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
