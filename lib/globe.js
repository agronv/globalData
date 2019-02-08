import * as THREE from 'three';
import countries from './countries3';

document.addEventListener('DOMContentLoaded', () => {
    var container = document.getElementById('main');

    var camera, scene, renderer, width, height, mesh;
    var mouse = { x: 0, y: 0 }, mouseOnDown = { x: 0, y: 0 };
    var rotation = { x: 0, y: 0 },
        target = { x: Math.PI * 3 / 2, y: Math.PI / 6.0 },
        targetOnDown = { x: 0, y: 0 };

    width = window.innerWidth;
    height = window.innerHeight;
    camera = new THREE.PerspectiveCamera(30, width / height, 1, 10000);
    camera.position.z = 10000;

    scene = new THREE.Scene();

    var geometry = new THREE.SphereGeometry(200, 40, 30);
    const loader = new THREE.TextureLoader();
    const mapOverlay = loader.load('https://s3.amazonaws.com/notefloat-dev/earth-countries.png');
    var material = new THREE.MeshBasicMaterial({ map: mapOverlay});
    mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.y = Math.PI;
    scene.add(mesh);

    geometry = new THREE.BoxGeometry(5, 5, 1);
    geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, -0.5));
    var point = new THREE.Mesh(geometry);

    renderer = new THREE.WebGLRenderer({ antialias: true });
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

        target.x = targetOnDown.x + (mouse.x - mouseOnDown.x) * 0.005;
        target.y = targetOnDown.y + (mouse.y - mouseOnDown.y) * 0.005;
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
        countriesList.appendChild(countryLi);
        countryLi.addEventListener("click", findCountry);
    }); 

    // var subgeo = new THREE.Geometry();
    function addPoint(lat, lon, size, subgeo) {

        var phi = (90 - lat) * Math.PI / 180;
        var theta = (180 - lon) * Math.PI / 180;

        point.position.x = 200 * Math.sin(phi) * Math.cos(theta);
        point.position.y = 200 * Math.cos(phi);
        point.position.z = 200 * Math.sin(phi) * Math.sin(theta);
        
        point.lookAt(mesh.position);

        // point.scale.z = Math.max(size, 0.1); // avoid non-invertible matrix
        point.updateMatrix();

        // for (var i = 0; i < point.geometry.faces.length; i++) {
        //     point.geometry.faces[i].color = 0xff0000;
        // }

        if (point.matrixAutoUpdate) {
            point.updateMatrix();
        }
        scene.add(point);
        // subgeo.merge(point.geometry, point.matrix);
    }
    
    function findCountry(e) {
        e.preventDefault();
        let abbr = e.target.id;

        let proxyUrl = "https://corsproxyglobe.herokuapp.com/";
        let url = `https://atlas.media.mit.edu/hs92/import/2017/${abbr}/show/0101/`;
        fetch(proxyUrl + url).then((response) => { return response.json(); }).then((myJson) => { createBars(myJson, "import"); });
        
        url = `https://atlas.media.mit.edu/hs92/export/2017/${abbr}/show/0101/`;
        fetch(proxyUrl + url).then((response) => { return response.json(); }).then((myJson) => { createBars2(myJson, "export"); });
    }


    function createBars(Json, type) {
        Object.values(Json.data).forEach((country) => {
            let value = Math.log(country.export_val);
            if (value > 6) value = 6;
            if (value < 2) value = 2;
            geometry = new THREE.BoxGeometry(value, value, value * 8);
            geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, -0.5));
            if (type === 'import') material = new THREE.MeshBasicMaterial({ color: "rgb(0,0,255)" });
            else material = new THREE.MeshBasicMaterial({ color: "rgb(255,0,0)" });
            point = new THREE.Mesh(geometry, material);
            let abbr = country.dest_id.slice(2);
            let nation = countries[abbr.toUpperCase()];
            addPoint(parseFloat(nation.lat), parseFloat(nation.lon) + 2, 100);
        });
    }

    function createBars2(Json, type) {
        Object.values(Json.data).forEach((country) => {
            let value = Math.log(country.export_val);
            if (value > 6) value = 6;
            if (value < 2) value = 2;
            geometry = new THREE.BoxGeometry(value, value, value * 8);
            geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, -0.5));
            if (type === 'import') material = new THREE.MeshBasicMaterial({ color: "rgb(0,0,255)" });
            else material = new THREE.MeshBasicMaterial({ color: "rgb(255,0,0)" });
            point = new THREE.Mesh(geometry, material);
            let abbr = country.dest_id.slice(2);
            let nation = countries[abbr.toUpperCase()];
            addPoint(parseFloat(nation.lat), parseFloat(nation.lon) + 2, 100);
        });
    }
});