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
    camera = new THREE.PerspectiveCamera(30, 1500 / height, 1, 10000);
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
    renderer.setSize(1500, height);

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
        countryLi.setAttribute("class", "invisible");
        countriesList.appendChild(countryLi);
        countryLi.addEventListener("click", findCountry);
    }); 

    function addPoint(lat, lon) {
        var phi = (90 - lat) * Math.PI / 180;
        var theta = (180 - lon) * Math.PI / 180;

        point.position.x = 200 * Math.sin(phi) * Math.cos(theta);
        point.position.y = 200 * Math.cos(phi);
        point.position.z = 200 * Math.sin(phi) * Math.sin(theta);
        
        point.lookAt(mesh.position);
        point.updateMatrix();

        if (point.matrixAutoUpdate) {
            point.updateMatrix();
        }
        scene.add(point);
    }
    
    function findCountry(e) {
        e.preventDefault();
        let abbr = e.target.id;
        for (let i = scene.children.length-1; i > 0; i--) {
            scene.remove(scene.children[i]);
        }
        let proxyUrl = "https://corsproxyglobe.herokuapp.com/";
        let url = `https://atlas.media.mit.edu/hs92/import/2017/${abbr}/show/0201/`;
        fetch(proxyUrl + url).then((response) => { return response.json(); }).then((myJson) => { createBars(myJson); });
    }

    function createBars(Json) {
        let value, abbr, nation, material, geometry;
        Object.values(Json.data).forEach((country) => {
            if (country.export_val) {
                value = Math.pow(country.export_val, 0.3);
                if (value > 150) value = 150;
                if (value < 2) value = 2;
                geometry = new THREE.BoxGeometry(3, 3, value);
                geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, -0.5));
                material = new THREE.MeshBasicMaterial({ color: "rgb(255,0,0)" });
                point = new THREE.Mesh(geometry, material);
                abbr = country.dest_id.slice(2);
                nation = countries[abbr.toUpperCase()];
                addPoint(parseFloat(nation.lat), parseFloat(nation.lon) + 2);
            }
            if (country.import_val){
                value = Math.pow(country.import_val, 0.3);
                if (value > 150) value = 150;
                if (value < 2) value = 2;
                geometry = new THREE.BoxGeometry(3, 3, value);
                geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, -0.5));
                material = new THREE.MeshBasicMaterial({ color: "rgb(0,0,255)" });
                point = new THREE.Mesh(geometry, material);
                abbr = country.dest_id.slice(2);
                nation = countries[abbr.toUpperCase()];
                addPoint(parseFloat(nation.lat), parseFloat(nation.lon));
            }
        });
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

    const countryInput = document.getElementById("country_input");
    countryInput.addEventListener("change", (e) => {
        for (let i = 0; i < countriesList.children.length; i++) {
            if (stringIncludeKey(countriesList.children[i].textContent, e.target.value)) {
                countriesList.children[i].setAttribute("class", "");
            }
            else countriesList.children[i].setAttribute("class", "invisible");
        }
    });
});