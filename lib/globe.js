import * as THREE from 'three';
import countries from './countries';
import products from './filtered';

document.addEventListener('DOMContentLoaded', () => {
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
                'float intensity = 1.3 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
                'vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 10.0 );',
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
                'float intensity = pow( 1.2 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 20.0 );',
                'gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * intensity;',
                '}'
            ].join('\n')
        }
    };

    let container = document.getElementById('main');

    let camera, scene, renderer, width, height, mesh, geometry, loader, shader, uniforms, material, formerActive;
    let mouse = { x: 0, y: 0 }, mouseOnDown = { x: 0, y: 0 };
    let rotation = { x: 0, y: 0 },
        target = { x: Math.PI * 3 / 2, y: Math.PI / 6.0 },
        targetOnDown = { x: 0, y: 0 };
    let rotationSpeed = 0.002;

    let curZoomSpeed = 0;
    let distance = 100000, distanceTarget = 100000;

    width = window.innerWidth;
    height = window.innerHeight-5;
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
    let point = new THREE.Mesh(geometry);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height);

    container.appendChild(renderer.domElement);

    function onMouseDown(e) {
        e.preventDefault();
        container.addEventListener('mousemove', onMouseMove, false);
        container.addEventListener('mouseup', onMouseUp, false);
        container.addEventListener('mouseout', onMouseOut, false);
        rotationSpeed = 0;
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
        rotationSpeed = 0.002;
        container.removeEventListener('mousemove', onMouseMove, false);
        container.removeEventListener('mouseup', onMouseUp, false);
        container.removeEventListener('mouseout', onMouseOut, false);
    }

    function onMouseOut(e) {
        e.preventDefault();
        rotationSpeed = 0.002;
        container.removeEventListener('mousemove', onMouseMove, false);
        container.removeEventListener('mouseup', onMouseUp, false);
        container.removeEventListener('mouseout', onMouseOut, false);
    }

    function animate() {
        requestAnimationFrame(animate);
        render();
    }

    function zoom(delta) {
        distanceTarget -= delta;
        distanceTarget = distanceTarget > 1000 ? 1000: distanceTarget;
        distanceTarget = distanceTarget < 300 ? 300 : distanceTarget;
    }


    function render() {
        zoom(curZoomSpeed);

        distance += (distanceTarget - distance) * 0.1;
        // if (distance-1000 > 2 || 1000-distance > 400) rotationSpeed = 0;
        // else rotationSpeed = 0.002; 

        target.x += rotationSpeed;
        rotation.x += (target.x - rotation.x) * 0.1;
        rotation.y += (target.y - rotation.y) * 0.1;
        camera.position.x = distance * Math.sin(rotation.x) * Math.cos(rotation.y);
        camera.position.y = distance * Math.sin(rotation.y);
        camera.position.z = distance * Math.cos(rotation.x) * Math.cos(rotation.y);
        
        camera.lookAt(mesh.position);
        renderer.render(scene, camera);
    }
    animate();
    container.addEventListener('mousedown', onMouseDown, false);
    container.addEventListener('mousewheel', onMouseWheel, false);

    function onMouseWheel(event) {
        event.preventDefault();
        if (renderer) {
            zoom(event.wheelDeltaY * 0.3);
        }
        return false;
    }

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
    Object.keys(products).forEach((product) => {
        productLi = document.createElement('li');
        productLi.appendChild(document.createTextNode(product));
        productLi.setAttribute("id", products[product]);
        productLi.setAttribute("class", "invisible");
        productList.appendChild(productLi);
        productLi.addEventListener("click", fetchProduct);
    });

    let yearLi;
    let yearList = document.getElementById('years-list');
    for (let i = 1997; i < 2018; i++) {
        yearLi = document.createElement('li');
        yearLi.appendChild(document.createTextNode(i));
        yearLi.setAttribute("id", `year-${i}`);
        if (i === 2017) yearLi.className += "active";
        yearList.appendChild(yearLi);
        yearLi.addEventListener("click", fetchYear);
    }

    let currentCountry = "usa";
    let currentProduct = "0808"; 
    let currentYear = "2017";

    const yearInput = document.getElementById("year-input");
    const productInput = document.getElementById("product-input");
    const countryInput = document.getElementById("country-input");
    const loading = document.getElementById("loader");
    const noData = document.getElementById("no-data");
    countryInput.value = "United States of America";
    productInput.value = "Apples";

    const proxyUrl = "https://corsproxyglobe.herokuapp.com/";
    let url, value, nation;

    let importBar = document.getElementById("import-bar");
    let exportBar = document.getElementById("export-bar");
    let importText = document.getElementById("import-text");
    let exportText = document.getElementById("export-text");

    fetchData();

    function fetchData() {
        loading.className = "loader";
        noData.className = "";
        for (let i = scene.children.length - 1; i > 0; i--) {
            scene.remove(scene.children[i]);
        }

        url = `https://atlas.media.mit.edu/hs07/import/${currentYear}/${currentCountry}/show/${currentProduct}/`;
        console.log(url);
        fetch(proxyUrl + url).then(response => response.json()).then(myJson => createBars(myJson));
    }

    function fetchCountry(e) {
        e.preventDefault();
        currentCountry = e.target.id;
        countryInput.value = e.target.innerText;
        for (let i = 0; i < countriesList.children.length; i++) {
            countriesList.children[i].setAttribute("class", "invisible");
        }
        fetchData();
    }

    function fetchProduct(e) {
        e.preventDefault();
        currentProduct = e.target.id;
        productInput.value = e.target.innerText;
        for (let i = 0; i < productList.children.length; i++) {
            productList.children[i].setAttribute("class", "invisible");
        }
        fetchData();
    }

    function fetchYear(e) {
        e.preventDefault();
        formerActive = document.getElementsByClassName("active");
        if (formerActive.length > 0) formerActive[0].className = "";
        yearInput.value = e.target.id.split("-")[1];
        currentYear = e.target.id.split("-")[1];
        e.target.className += "active";
        fetchData();
    }

    let exportSum;
    let importSum;
    let maxSum;

    function makeChart(exportSum, importSum) {
        if (importSum > exportSum) maxSum = importSum;
        else maxSum = exportSum;
        importBar.style = `height: ${(importSum/maxSum)*height*0.75}px`;
        exportBar.style = `height: ${(exportSum/maxSum)*height*0.75}px`;
        importText.innerText = formatNum(importSum);
        exportText.innerText = formatNum(exportSum);
    }

    function formatNum(num) {
        if (num >= 100000000) return `$${parseFloat(num/1000000000, 10).toFixed(2)}B`;
        else if (num >= 100000) return `$${parseFloat(num / 1000000, 10).toFixed(2)}M`;
        else if (num >= 100) return `$${parseFloat(num / 1000, 10).toFixed(2)}K`;
        return 0;
    }

    function createBars(Json) {
        exportSum = 0;
        importSum = 0;
        importBar.style = `height: 0px`;
        exportBar.style = `height: 0px`;
        importText.innerText = 0;
        exportText.innerText = 0;
        loading.className = "";
        let dataArray = Object.values(Json.data);
        if (dataArray.length === 0) {
            noData.className = "no-data-active";
        }
        for (let i = 0; i < dataArray.length; i++) {
            if (dataArray[i].export_val) {
                importerExport(dataArray[i].dest_id.slice(2), dataArray[i].export_val, false);
                exportSum += dataArray[i].export_val;
            }
            if (dataArray[i].import_val) {
                importerExport(dataArray[i].dest_id.slice(2), dataArray[i].export_val, true);
                importSum += dataArray[i].import_val;
            }    
            makeChart(exportSum, importSum);
        }
    }

    function importerExport(abbr, rawValue, imported) {
        value = Math.pow(rawValue, 0.3);
        if (value > 150) value = 150;
        if (value < 2) value = 2;
        geometry = new THREE.BoxGeometry(3, 3, value);
        geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, -0.5));
        if (imported) material = new THREE.MeshBasicMaterial({ color: "rgb(45, 51, 227)" });
        else material = new THREE.MeshBasicMaterial({ color: "rgb(215, 38, 38)" });
        point = new THREE.Mesh(geometry, material);
        nation = countries[abbr.toUpperCase()];
        if (imported) addPoint(parseFloat(nation.lat), parseFloat(nation.lon) + 1);
        else addPoint(parseFloat(nation.lat), parseFloat(nation.lon));
    }

    function addPoint(lat, lon) {
        let phi = (90 - lat) * Math.PI / 180;
        let theta = (180 - lon) * Math.PI / 180;

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

    countryInput.addEventListener("input", (e) => {
        for (let i = 0; i < countriesList.children.length; i++) {
            if (e.target.value !== "" && stringIncludeKey(countriesList.children[i].textContent, e.target.value)) {
                countriesList.children[i].setAttribute("class", "");
            }
            else countriesList.children[i].setAttribute("class", "invisible");
        }
    });

    productInput.addEventListener("input", (e) => {
        for (let i = 0; i < productList.children.length; i++) {
            if (e.target.value !== "" && stringIncludeKey(productList.children[i].textContent, e.target.value)) {
                productList.children[i].setAttribute("class", "");
            }
            else productList.children[i].setAttribute("class", "invisible");
        }
    });

    yearInput.addEventListener("input", (e) => {
        formerActive = document.getElementsByClassName("active");
        if (formerActive.length > 0) formerActive[0].className = "";
        yearLi = document.getElementById(`year-${e.target.value}`);
        yearLi.className += "active";
        currentYear = e.target.value;
        fetchData();
    });

    const main = document.getElementById("main");
    main.addEventListener("mouseup", (e) => {
        for (let i = 0; i < countriesList.children.length; i++) {
            countriesList.children[i].setAttribute("class", "invisible");
        }
        for (let i = 0; i < productList.children.length; i++) {
            productList.children[i].setAttribute("class", "invisible");
        }
    });
});