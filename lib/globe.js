import * as THREE from 'three';
import countries from './countries';
import products from './filtered';
import { geoInterpolate } from 'd3-geo';

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

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    container.addEventListener('mousedown', onMouseDown, false);
    container.addEventListener('mousewheel', onMouseWheel, false);

    function onMouseWheel(event) {
        event.preventDefault();
        if (renderer) {
            zoom(event.wheelDeltaY * 0.3);
        }
        return false;
    }

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

    // search inputs



    
    let countryLi;
    let countriesList = document.getElementById('countries-list');
    let productLi;
    let productList = document.getElementById('products-list');

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
    let currentCountryName = "United States of America";
    let currentProduct = "0808"; 
    let currentProductName = "Apples"; 
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
        value = Math.pow(rawValue, 0.5);
        value = value * 0.0003;
        if (value > 5) value = 5;
        if (value < 0.01) value = 0.01;
        if (imported) material = new THREE.LineBasicMaterial({ color: "rgb(24, 251, 255)" });
        else material = new THREE.LineBasicMaterial({ color: "#ff33e0" });

        nation = countries[abbr.toUpperCase()];
        if (imported) addPoint(parseFloat(nation.lat), parseFloat(nation.lon) + 1, value);
        else addPoint(parseFloat(nation.lat), parseFloat(nation.lon), value);
    }

    function addPoint(startLat, startLon, value) {
        let endLat = parseFloat(countries[currentCountry.toUpperCase()].lat);
        let endLon = parseFloat(countries[currentCountry.toUpperCase()].lon);
        
        let curve = getSplineFromCoords(startLat, startLon, endLat, endLon);

        // if (value < 1) {
        //     geometry = new THREE.TubeBufferGeometry(curve, 16, value, 3, false);
        // }
        // else if (value < 2) {
        //     geometry = new THREE.TubeBufferGeometry(curve, 16, value, 8, false);
        // } else {
        //     geometry = new THREE.TubeBufferGeometry(curve, 16, value, 16, false);
        // }
        geometry = new THREE.TubeBufferGeometry(curve, 16, value, 3, false);

        var curveObject = new THREE.Line(geometry, material);

        scene.add(curveObject);
    }






    const GLOBE_RADIUS = 180;
    const CURVE_MIN_ALTITUDE = 20;
    const CURVE_MAX_ALTITUDE = 200;

    function clamp(num, min, max) {
        return num <= min ? min : (num >= max ? max : num);
    }

    // util function to convert lat/lng to 3D point on globe
    function coordinateToPosition(lat, lng, radius) {
        const phi = (90 - lat) * Math.PI / 180;
        const theta = (180 - lng) * Math.PI / 180;

        return new THREE.Vector3(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.cos(phi),
            radius * Math.sin(phi) * Math.sin(theta)
        );
    }

    function getSplineFromCoords(startLat, startLng, endLat, endLng) {

        // start and end points
        const start = coordinateToPosition(startLat, startLng, GLOBE_RADIUS);
        const end = coordinateToPosition(endLat, endLng, GLOBE_RADIUS);

        // altitude
        const altitude = clamp(start.distanceTo(end) * .75, CURVE_MIN_ALTITUDE, CURVE_MAX_ALTITUDE);

        // 2 control points
        const interpolate = geoInterpolate([startLng, startLat], [endLng, endLat]);
        const midCoord1 = interpolate(0.25);
        const midCoord2 = interpolate(0.75);
        const mid1 = coordinateToPosition(midCoord1[1], midCoord1[0], GLOBE_RADIUS + altitude);
        const mid2 = coordinateToPosition(midCoord2[1], midCoord2[0], GLOBE_RADIUS + altitude);

        return new THREE.CubicBezierCurve3(start, mid1, mid2, end);
    }







    function makeChart(exportSum, importSum) {
        if (importSum > exportSum) maxSum = importSum;
        else maxSum = exportSum;
        importBar.style = `height: ${(importSum / maxSum) * height * 0.75}px`;
        exportBar.style = `height: ${(exportSum / maxSum) * height * 0.75}px`;
        importText.innerText = formatNum(importSum);
        exportText.innerText = formatNum(exportSum);
    }

    function formatNum(num) {
        if (num >= 100000000) return `$${parseFloat(num / 1000000000, 10).toFixed(2)}B`;
        else if (num >= 100000) return `$${parseFloat(num / 1000000, 10).toFixed(2)}M`;
        else if (num >= 100) return `$${parseFloat(num / 1000, 10).toFixed(2)}K`;
        return 0;
    }

    function fetchCountry(e) {
        e.preventDefault();
        currentCountry = e.target.id;
        currentCountryName = e.target.innerText;
        countryInput.value = currentCountryName;
        while (countriesList.firstChild) {
            countriesList.removeChild(countriesList.firstChild);
        }
        fetchData();
    }

    function fetchProduct(e) {
        e.preventDefault();
        currentProduct = e.target.id;
        currentProductName = e.target.innerText;
        productInput.value = currentProductName;
        while (productList.firstChild) {
          productList.removeChild(productList.firstChild);
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

    function fetchData() {
        loading.className = "loader";
        noData.className = "";

        for (let i = scene.children.length - 1; i > 0; i--) {
            scene.remove(scene.children[i]);
        }

        url = `https://atlas.media.mit.edu/hs92/import/${currentYear}/${currentCountry}/show/${currentProduct}/`;
        console.log(url);
        fetch(proxyUrl + url).then(response => response.json()).then(myJson => createBars(myJson));
    }

    let exportSum;
    let importSum;
    let maxSum;

    function stringKeyValue(string, key) {
        let stringIdx = 0;
        let keyIdx = 0;
        let value = string.length === key.length ? 1 : 0; 
        let multiplier = 1;

        function _stringKeyValue() {
            if (keyIdx === key.length) return value;
            if ( stringIdx === string.length) return value > 4 ? value : 0;
            if (string[stringIdx].toLowerCase() === key[keyIdx].toLowerCase()) {
              value += multiplier;
              multiplier *= 2;
              keyIdx++;
            }
            else {
              multiplier = Math.floor(multiplier/2) || 1;
            }
            stringIdx++;
            return _stringKeyValue();
        }

        return _stringKeyValue();
    }

    function generateProductSearch(key) {
      let result = [];
      let productValue;
      Object.keys(products).forEach((productName) => {
        productValue = stringKeyValue(productName, key);
        if (productValue) {
          result.push({value: productValue,name: productName,id: products[productName]});
        }
      });
      return quickSort(result);
    }

    function generateCountrySearch(key) {
      let result = [];
      let countryValue;
      Object.values(countries).forEach((country) => {
          countryValue = stringKeyValue(country.name, key);
        if (countryValue) {
          result.push({value: countryValue,name: country.name,id: country.abbr});
        }
      });
      return quickSort(result);
    }

    function quickSort(arr) {
      if (arr.length <= 0) return arr;
      let middle = arr[0];
      let left = [];
      let right = [];
      let middler = [];
      arr.forEach((product) => {
        if (product.value < middle.value) {
          right.push(product);
        } 
        else if (product.value === middle.value) {
          middler.push(product);
        }
        else {
          left.push(product);
        }
      });
      let leftSorted = quickSort(left);
      let rightSorted = quickSort(right);

      return leftSorted.concat(middler, rightSorted);
    }

    countryInput.addEventListener("input", (e) => {
        while (countriesList.firstChild) {
            countriesList.removeChild(countriesList.firstChild);
        }
        let countryLis = generateCountrySearch(e.target.value);
        countryLis.forEach((country) => {
            countryLi = document.createElement('li');
            countryLi.appendChild(document.createTextNode(country.name));
            countryLi.setAttribute("id", country.id);
            countryLi.classList.add("list-item");
            countriesList.appendChild(countryLi);
            countryLi.addEventListener("click", fetchCountry);
        });
    });

    productInput.addEventListener("input", (e) => {
        while (productList.firstChild) {
          productList.removeChild(productList.firstChild);
        }
        let productLis = generateProductSearch(e.target.value);
        productLis.forEach((product) => {
          productLi = document.createElement('li');
          productLi.appendChild(document.createTextNode(product.name));
          productLi.setAttribute("id", product.id);
          productLi.className = "list-item";
          productList.appendChild(productLi);
          productLi.addEventListener("click", fetchProduct);
        });
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
        while (countriesList.firstChild) {
            countriesList.removeChild(countriesList.firstChild);
        }
        while (productList.firstChild) {
          productList.removeChild(productList.firstChild);
        }
        countryInput.value = currentCountryName;
        productInput.value = currentProductName;
    });

    countryInput.addEventListener("click", () => {
        countryInput.value = "";
    });

    productInput.addEventListener("click", () => {
        productInput.value = "";
    });
});