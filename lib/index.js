import * as THREE from 'three';
import Globe from './globe';
import Routes from './routes';
import Inputs from './inputs';

document.addEventListener('DOMContentLoaded', () => {
    const scene = new THREE.Scene();
    const container = document.getElementById('main');
    const loading = document.getElementById("loader");
    const noData = document.getElementById("no-data");

    const width = window.innerWidth;
    const height = window.innerHeight - 5;
    const globeRadius = 180;

    const earth = new Globe(scene, container, globeRadius, height, width);
    earth.animate();

    const routes = new Routes(scene, globeRadius, height, noData);
    const inputs = new Inputs(scene, container, routes, loading, noData);
});