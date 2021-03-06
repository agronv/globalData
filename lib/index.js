import * as THREE from 'three';
import Globe from './globe';
import Arcs from './arcs';
import Inputs from './inputs';

document.addEventListener('click', start);
document.addEventListener('keypress', start);

function start (e) {
    document.removeEventListener('click', start)
    document.removeEventListener('keypress', start)

    const intro = document.getElementById('intro');
    const title = document.getElementById('title');
    const searchQuery = document.getElementById('search-query');
    intro.className = "fade-away"
    title.className = "appear"
    searchQuery.className = "appear"

    const scene = new THREE.Scene();
    const container = document.getElementById('main');
    const loading = document.getElementById("loader");
    const noData = document.getElementById("no-data");

    const shifter = -5
    const width = window.innerWidth;
    const height = window.innerHeight + shifter;
    const globeRadius = 180;

    const earth = new Globe(scene, container, globeRadius, height, width, shifter);
    earth.animate();

    const arcs = new Arcs(scene, globeRadius, height, noData, shifter, earth);
    const inputs = new Inputs(scene, container, arcs, loading, noData);
}