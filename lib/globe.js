// import * as THREE from 'three';

// document.addEventListener('DOMContentLoaded', () => {

//     const container = document.getElementById('main');
//     const renderer = new THREE.WebGLRenderer();

//     const width = window.innerWidth;
//     const height = window.innerHeight;
//     renderer.setSize(width, height);

//     const camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
//     camera.position.z = 500;
//     const scene = new THREE.Scene();
//     scene.background = new THREE.Color(0x000);
//     // camera.lookAt(scene.width / 2, scene.height / 2);	
//     scene.add(camera);

//     container.appendChild(renderer.domElement);

//     // var globe = new THREE.Group();
//     // scene.add(globe);
//     var loader = new THREE.TextureLoader();
//     var sphere = new THREE.SphereGeometry(200, 50, 50);
//     var mesh = new THREE.Mesh(sphere);
//     loader.load('./lib/land_ocean_ice_cloud_2048.jpg', function (texture) {
//         var material = new THREE.MeshBasicMaterial({ map: 'lib/land_ocean_ice_cloud_2048.jpg'});
//         mesh.material = material;
//         scene.add(mesh);
//     });
//     mesh.position.z = -300;

//     let lighting = new THREE.SpotLight(0xeeeeee, 3);
//     lighting.position.x = 730;
//     lighting.position.y = 520;
//     lighting.position.z = 626;
//     lighting.castShadow = true;
//     scene.add(lighting);

//     function animate() {
//         requestAnimationFrame(animate);
//         renderer.render(scene, camera);
//     }
//     animate();

//     let prevPosition = [width / 2, height / 2];
//     function rotateOnMouseMove(e) {
//         e.preventDefault();

//         const newXPos = (e.clientX - prevPosition[0]);
//         const newYPos = (e.clientY - prevPosition[1]);

//         globe.rotation.y += (newXPos * .005);
//         globe.rotation.x += (newYPos * .005);
//         prevPosition[0] = e.clientX;
//         prevPosition[1] = e.clientY;
//     }

//     function onMouseDown(e) {
//         container.addEventListener('mousemove', rotateOnMouseMove, false);
//         container.addEventListener('mouseup', onMouseUp, false);
//     }

//     function onMouseUp(event) { 
//         container.removeEventListener('mousemove', rotateOnMouseMove, false);
//         container.removeEventListener('mouseup', onMouseUp, false);
//     }
    
//     container.addEventListener('mousedown', onMouseDown, false);
// });
import * as THREE from 'three';

document.addEventListener('DOMContentLoaded', () => {
    var container = document.getElementById('main');

    var camera, scene, renderer, width, height, mesh, point;
    var mouse = { x: 0, y: 0 }, mouseOnDown = { x: 0, y: 0 };
    var rotation = { x: 0, y: 0 },
        target = { x: Math.PI * 3 / 2, y: Math.PI / 6.0 },
        targetOnDown = { x: 0, y: 0 };

    width = window.innerWidth;
    height = window.innerHeight;
    camera = new THREE.PerspectiveCamera(30, width / height, 1, 10000);
    camera.position.z = 10000;

    scene = new THREE.Scene();

    var geometry = new THREE.SphereGeometry(200, 50, 50);
    const loader = new THREE.TextureLoader();
    const mapOverlay = loader.load('https://s3.amazonaws.com/notefloat-dev/land_ocean_ice_cloud_2048.jpg');
    var material = new THREE.MeshBasicMaterial({ map: mapOverlay});
    mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.y = Math.PI;
    scene.add(mesh);

    geometry = new THREE.BoxGeometry(0.75, 0.75, 1);
    geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, -0.5));
    point = new THREE.Mesh(geometry);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);

    container.appendChild(renderer.domElement);
    // function addPoint(lat, lng, size, color) {

    //     var phi = (90 - lat) * Math.PI / 180;
    //     var theta = (180 - lng) * Math.PI / 180;

    //     point.position.x = 200 * Math.sin(phi) * Math.cos(theta);
    //     point.position.y = 200 * Math.cos(phi);
    //     point.position.z = 200 * Math.sin(phi) * Math.sin(theta);

    //     point.lookAt(mesh.position);

    //     point.scale.z = Math.max(size, 0.1); // avoid non-invertible matrix
    //     point.updateMatrix();

    //     for (var i = 0; i < point.geometry.faces.length; i++) {

    //         point.geometry.faces[i].color = color;

    //     }
    //     if (point.matrixAutoUpdate) {
    //         point.updateMatrix();
    //     }
    //     subgeo.merge(point.geometry, point.matrix);
    // }

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

    const button = document.getElementById('latlon');

    button.addEventListener('click', ()=> {
        let phi = (90 - 0) * Math.PI / 180;
        let theta = (180 - 0) * Math.PI / 180;

        target.x = 200 * Math.sin(phi) * Math.cos(theta);
        target.y = 200 * Math.cos(phi);
    });

    // function createCORSRequest(method, url) {
    //     var xhr = new XMLHttpRequest();
    //     debugger
    //     if ("withCredentials" in xhr) {
    //         // XHR for Chrome/Firefox/Opera/Safari.
    //         xhr.open(method, url, true);
    //     } else if (typeof XDomainRequest != "undefined") {
    //         // XDomainRequest for IE.
    //         xhr = new XDomainRequest();
    //         xhr.open(method, url);
    //     } else {
    //         // CORS not supported.
    //         xhr = null;
    //     }
    //     return xhr;
    // }

    function makeCorsRequest() {
        var url = 'http://atlas.media.mit.edu/hs92/export/2010/usa/all/show/';

        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        
        // Response handlers.
        xhr.onload = () => {
            console.log(xhr.status); // for status info
            console.log(xhr.responseType); //the type of data that was returned
            console.log(xhr.response); //the actual response. For JSON api calls, this will be a JSON string
            debugger
        };
        // debugger
        xhr.onerror = () => {
            // alert('Woops, there was an error making the request.');
        };
        xhr.setRequestHeader('Access-Control-Allow-Headers', '*');
        xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
        xhr.send();
    }

    makeCorsRequest();
});