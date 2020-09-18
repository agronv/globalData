CSS BabelResult
EDIT ON



const range = (min, max) => Math.floor(min + Math.random() * (max + 1 - min))

const entries = [
    { color: 0xcc8b3a, height: 1 },
    { color: 0x563071, height: 2 },
    { color: 0x3c4b6e, height: 4 },
    { color: 0x8f221f, height: 8 }
]

class Sphere {
    constructor() {
        this.scene = new THREE.Scene()
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            1,
            1000
        )
        this.mouse = new THREE.Vector2()
        this.camera.position.z = 200
        this.camera.rotation.z *= 0.2

        this.group = new THREE.Group()

        this.clock = new THREE.Clock()

        this.renderer = new THREE.WebGLRenderer({ antialias: true })
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.renderer.setPixelRatio(window.devicePixelRatio * 1.5)
        this.raycaster = new THREE.Raycaster()

        document.body.appendChild(this.renderer.domElement)

        this.cubeGeometry = new THREE.BoxGeometry(1, 1, 10)
        this.center = new THREE.Vector3(0, 0, 0)
    }

    bindEvents = () => {
        window.addEventListener('click', this.onClick)
    }

    init() {
        this.renderSphere()
        this.renderDataPoints()
        this.bindEvents()
        this.setupLights()

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)
        this.controls.update()
        this.scene.add(this.group)

        return this
    }

    setupLights = () => {
        const pointLight = new THREE.PointLight(0xffffff, 5, 60)
        pointLight.position.set(50, 50, 76)
        this.lightHolder = new THREE.Group()
        this.lightHolder.add(pointLight)
        this.scene.add(this.lightHolder)

        this.light = new THREE.SpotLight(0xffffff)

        this.light.castShadow = true

        this.light.shadow.mapSize.width = 50
        this.light.shadow.mapSize.height = 50

        this.light.shadow.camera.near = 500
        this.light.shadow.camera.far = 3000
        this.light.shadow.camera.fov = 75
        this.scene.add(this.light)
    }

    prev = null
    outline = null
    shouldRotate = true

    onClick = event => {
        if (this.isInUpdateMode) return

        this.mouse.x = event.clientX / window.innerWidth * 2 - 1
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

        this.raycaster.setFromCamera(this.mouse, this.camera)

        let intersects = this.raycaster.intersectObjects(this.points)

        if (intersects[0]) {
            const item = intersects[0]
      
      var point = item.point;
      var camDistance = this.camera.position.length();
      this.camera.position.copy(point).normalize().multiplyScalar(camDistance);
      this.controls.update();

            if (this.outline) {
                this.group.remove(this.outline)
            }

            let outlineMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                side: THREE.FrontSide,
                wireframe: true
            })
      
      
            let outlineMesh = new THREE.Mesh(this.cubeGeometry, outlineMaterial)
            const { x, y, z } = item.object.position
            const { x: sx, y: sy, z: sz } = item.object.scale
            outlineMesh.position.set(x, y, z)
            outlineMesh.scale.set(sx, sy, sz)
            outlineMesh.lookAt(this.center)

            this.group.add(outlineMesh)

            this.outline = outlineMesh

            if (this.prev) {
                TweenMax.to(this.prev.object.material, 1, { emissiveIntensity: 0 })
            }

            //log(item.object)

            TweenMax.to(item.object.material, 1, { emissiveIntensity: 0.9 })

            this.shouldRotate = false
            this.prev = item;
      
        } else {
            this.shouldRotate = true
        }
    }

    getDistribution = n => {
        const rnd = 1
        const offset = 2 / n
        const increment = Math.PI * (3 - Math.sqrt(5))

        return Array(n)
            .fill(null)
            .map((_, i) => {
                const y = i * offset - 1 + offset / 2
                const r = Math.sqrt(1 - Math.pow(y, 2))
                const phi = ((i + rnd) % n) * increment

                return {
                    x: Math.cos(phi) * r,
                    z: Math.sin(phi) * r,
                    y
                }
            })
    }

    renderDataPoints = () => {
        this.points = this.getDistribution(2500).map(({ x, y, z }, index) => {
            const { color, height } = entries[range(0, 3)]
            const material = new THREE.MeshPhongMaterial({
                color: color,
                opacity: 1,
                transparent: false,
                emissive: color,
                emissiveIntensity: 0
            })

            const cube = new THREE.Mesh(this.cubeGeometry, material)

            cube.castShadow = true
            cube.receiveShadow = true

            cube.position.x = x * 76
            cube.position.y = y * 76
            cube.position.z = z * 76

            cube.material.color.setHex(color)
            cube.lookAt(this.center)
            cube.scale.y += 2.5
            cube.scale.x += 2.5
            cube.scale.z += height * 0.5

            cube.__animating = false
            cube.__id = index
            cube.__update = height
            cube.__default = 1

            this.group.add(cube)

            return cube
        })
    }

    renderSphere = () => {
        const material = new THREE.MeshBasicMaterial({
            color: 0x06131b,
            vertexColors: THREE.FaceColors
        })
        const geometry = new THREE.SphereGeometry(2500 * 0.03, 32, 32)
        const sphere = new THREE.Mesh(geometry, material)

        this.group.add(sphere)
    }

    render = timestamp => {
        if (this.shouldRotate) {
            if (!this.start) this.start = timestamp

            const progress = timestamp - this.start
            this.group.rotation.y = progress * 0.00005
            this.group.rotation.z = progress * 0.000025
        }

        this.lightHolder.quaternion.copy(this.camera.quaternion)
        this.light.position.copy(this.camera.position)

        //this.controls.update()
        this.renderer.render(this.scene, this.camera)
        requestAnimationFrame(this.render)
    }
}




new Sphere().init().render()
View Compiled

Resources1×0.5×0.25×Rerun
