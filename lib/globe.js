import * as THREE from 'three';
import countries from './countries';
import products from './filtered';

document.addEventListener('DOMContentLoaded', () => {

    var Shaders = {
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
                'float intensity = 1.1 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
                'vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 3.0 );',
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
                'float intensity = pow( 1.2 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 12.0 );',
                'gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * intensity;',
                '}'
            ].join('\n')
        }
    };

    var container = document.getElementById('main');

    var camera, scene, renderer, width, height, mesh, geometry, loader, shader, uniforms, material;
    var mouse = { x: 0, y: 0 }, mouseOnDown = { x: 0, y: 0 };
    var rotation = { x: 0, y: 0 },
        target = { x: Math.PI * 3 / 2, y: Math.PI / 6.0 },
        targetOnDown = { x: 0, y: 0 };

    width = 1000;
    // debugger
    height = window.innerHeight;
    camera = new THREE.PerspectiveCamera(30, width / height, 1, 10000);
    camera.position.z = 10000;
    scene = new THREE.Scene();

    geometry = new THREE.SphereGeometry(180, 100, 100);
    loader = new THREE.TextureLoader();
    shader = Shaders.earth;
    uniforms = THREE.UniformsUtils.clone(shader.uniforms);
    uniforms.texture.value = loader.load('https://s3.amazonaws.com/notefloat-dev/earth-countries.png');

    material = new THREE.ShaderMaterial({
          uniforms: uniforms,
          vertexShader: shader.vertexShader,
          fragmentShader: shader.fragmentShader
        });

    mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.y = Math.PI;
    scene.add(mesh);

    shader = Shaders.atmosphere;
    uniforms = THREE.UniformsUtils.clone(shader.uniforms);

    material = new THREE.ShaderMaterial({
          vertexShader: shader.vertexShader,
          fragmentShader: shader.fragmentShader,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          transparent: true
        });

    mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set( 1.2, 1.2, 1.2 );
    scene.add(mesh);

    geometry = new THREE.BoxGeometry(5, 5, 1);
    geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, -0.5));
    var point = new THREE.Mesh(geometry);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height);

    container.appendChild(renderer.domElement);

    function onMouseDown(e) {
        e.preventDefault();

        container.addEventListener('mousemove', onMouseMove, false);
        container.addEventListener('mouseup', onMouseUp, false);
        container.addEventListener('mouseout', onMouseOut, false);

        mouseOnDown.x = - event.clientX;
        mouseOnDown.y = event.clientY;
        targetOnDown.x = target.x;
        targetOnDown.y = target.y;
    }

    function onMouseMove(e) {
        e.preventDefault();
        mouse.x = - event.clientX;
        mouse.y = event.clientY;

        target.x = targetOnDown.x + (mouse.x - mouseOnDown.x) * 0.015;
        target.y = targetOnDown.y + (mouse.y - mouseOnDown.y) * 0.015;
        target.y = target.y > Math.PI / 2 ? Math.PI / 2 : target.y;
        target.y = target.y < - Math.PI / 2 ? - Math.PI / 2 : target.y;
    }

    function onMouseUp(e) {
        e.preventDefault();
        container.removeEventListener('mousemove', onMouseMove, false);
        container.removeEventListener('mouseup', onMouseUp, false);
        container.removeEventListener('mouseout', onMouseOut, false);
    }

    function onMouseOut(e) {
        e.preventDefault();
        container.removeEventListener('mousemove', onMouseMove, false);
        container.removeEventListener('mouseup', onMouseUp, false);
        container.removeEventListener('mouseout', onMouseOut, false);
    }

    function animate() {
        requestAnimationFrame(animate);
        render();
    }

    function render() {
        target.x += 0.001;
        rotation.x += (target.x - rotation.x) * 0.1;
        rotation.y += (target.y - rotation.y) * 0.1;
        camera.position.x = 1000 * Math.sin(rotation.x) * Math.cos(rotation.y);
        camera.position.y = 1000 * Math.sin(rotation.y);
        camera.position.z = 1000 * Math.cos(rotation.x) * Math.cos(rotation.y);
        
        camera.lookAt(mesh.position);
        renderer.render(scene, camera);
    }
    animate();
    container.addEventListener('mousedown', onMouseDown, false);


    let countryLi;
    let countriesList = document.getElementById('countries-list');
    Object.values(countries).forEach((country) => {
        countryLi = document.createElement('li');
        countryLi.appendChild(document.createTextNode(country.name));
        countryLi.setAttribute("id", country.abbr);
        countryLi.setAttribute("class", "invisible");
        countriesList.appendChild(countryLi);
        countryLi.addEventListener("click", fetchCountry);
    }); 

    let productLi;
    let productList = document.getElementById('products-list');
    products.forEach((product) => {
        productLi = document.createElement('li');
        productLi.appendChild(document.createTextNode(product[1]));
        productLi.setAttribute("id", product[0]);
        productLi.setAttribute("class", "invisible");
        productList.appendChild(productLi);
        productLi.addEventListener("click", fetchProduct);
    }); 

    let yearLi;
    let yearList = document.getElementById('years-list');
    for (let i = 1997; i < 2018; i++) {
        yearLi = document.createElement('li');
        yearLi.appendChild(document.createTextNode(i));
        yearLi.setAttribute("id", i);
        yearList.appendChild(yearLi);
        yearLi.addEventListener("click", fetchYear);
    }

    var currentCountry = "usa";
    var currentProduct = "0808"; 
    var currentYear = "2017";
    const proxyUrl = "https://corsproxyglobe.herokuapp.com/";
    var url, value, nation;
    fetchData();

    function fetchData() {
        for (let i = scene.children.length - 1; i > 0; i--) {
            scene.remove(scene.children[i]);
        }
        url = `https://atlas.media.mit.edu/hs92/import/${currentYear}/${currentCountry}/show/${currentProduct}/`;
        console.log(url);
        fetch(proxyUrl + url).then(response => response.json()).then(myJson => createBars(myJson));
    }
    
    function fetchCountry(e) {
        e.preventDefault();
        currentCountry = e.target.id;
        fetchData();
    }

    function fetchProduct(e) {
        e.preventDefault();
        currentProduct = e.target.id;
        fetchData();
    }

    function fetchYear(e) {
        e.preventDefault();
        currentYear = e.target.id;
        fetchData();
    }

    function createBars(Json) {
        Object.values(Json.data).forEach((country) => {
            if (country.export_val) importerExport(country.dest_id.slice(2), country.export_val, false);
            if (country.import_val) importerExport(country.dest_id.slice(2), country.export_val, true);
        });
    }

    function importerExport(abbr, rawValue, imported) {
        value = Math.pow(rawValue, 0.3);
        if (value > 150) value = 150;
        if (value < 2) value = 2;
        geometry = new THREE.BoxGeometry(3, 3, value);
        geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, -0.5));
        if (imported) material = new THREE.MeshBasicMaterial({ color: "rgb(0,0,255)" });
        else material = new THREE.MeshBasicMaterial({ color: "rgb(255,0,0)" });
        point = new THREE.Mesh(geometry, material);
        nation = countries[abbr.toUpperCase()];
        if (imported) addPoint(parseFloat(nation.lat), parseFloat(nation.lon) + 0.8);
        else addPoint(parseFloat(nation.lat), parseFloat(nation.lon));
    }

    function addPoint(lat, lon) {
        var phi = (90 - lat) * Math.PI / 180;
        var theta = (180 - lon) * Math.PI / 180;

        point.position.x = 180 * Math.sin(phi) * Math.cos(theta);
        point.position.y = 180 * Math.cos(phi);
        point.position.z = 180 * Math.sin(phi) * Math.sin(theta);

        point.lookAt(mesh.position);
        point.updateMatrix();

        if (point.matrixAutoUpdate) {
            point.updateMatrix();
        }
        scene.add(point);
    }

    function stringIncludeKey(string, key) {
        if (key === '') return true;
        if (string === "") return false;
        if (string[0].toLowerCase() === key[0].toLowerCase()) {
            return stringIncludeKey(string.slice(1), key.slice(1));
        }
        else if (string.length > 1) {
            return stringIncludeKey(string.slice(1), key);
        }
        return false;
    } 

    const countryInput = document.getElementById("country-input");
    countryInput.addEventListener("input", (e) => {
        for (let i = 0; i < countriesList.children.length; i++) {
            if ( e.target.value !== "" && stringIncludeKey(countriesList.children[i].textContent, e.target.value)) {
                countriesList.children[i].setAttribute("class", "");
            }
            else countriesList.children[i].setAttribute("class", "invisible");
        }
    });

    const productInput = document.getElementById("product-input");
    productInput.addEventListener("input", (e) => {
        for (let i = 0; i < productList.children.length; i++) {
            if ( e.target.value !== "" && stringIncludeKey(productList.children[i].textContent, e.target.value)) {
                productList.children[i].setAttribute("class", "");
            }
            else productList.children[i].setAttribute("class", "invisible");
        }
    });
});