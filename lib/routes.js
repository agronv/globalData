import * as THREE from 'three';
import countries from './countries.js';
import { geoInterpolate } from 'd3-geo';

export default class Routes {
  constructor(scene, globeRadius, height, loading, noData) {
    this.scene = scene;
    this.globeRadius = globeRadius;
    this.height = height;
    this.loading = loading;
    this.noData = noData;
    this.minAltitude = 20;
    this.maxAltitude = 200;
    this.importBar = document.getElementById("import-bar");
    this.exportBar = document.getElementById("export-bar");
    this.importText = document.getElementById("import-text");
    this.exportText = document.getElementById("export-text");

    this.createBars = this.createBars.bind(this);
    this.importOrExport = this.importOrExport.bind(this);
    this.addPoint = this.addPoint.bind(this);
    this.getCurveFromCoords = this.getCurveFromCoords.bind(this);
    this.makeChart = this.makeChart.bind(this);
  }

  createBars(Json, currentCountry) {
    this.currentCountry = currentCountry;

    this.exportSum = 0;
    this.importSum = 0;
    this.loading.className = "";

    const data = Object.values(Json.data);    
    if (!data.length) this.noData.className = "no-data-active";

    data.forEach( (country) => {
      if (country.export_val) {
        this.importOrExport(country.dest_id.slice(2), country.export_val, false);
        this.exportSum += country.export_val;
      }
      if (country.import_val) {
        this.importOrExport(country.dest_id.slice(2), country.export_val, true);
        this.importSum += country.import_val;
      }
    });
    this.makeChart();
  }

  importOrExport(abbr, rawValue, imported) {
    this.value = Math.pow(rawValue, 0.5) * 0.0003;
    if (this.value > 5) this.value = 5;
    if (this.value < 0.01) this.value = 0.01;

    if (imported) this.material = new THREE.LineBasicMaterial({ color: "rgb(24, 251, 255)" });
    else this.material = new THREE.LineBasicMaterial({ color: "#ff33e0" });

    const country = countries[abbr.toUpperCase()];
    if (country && country.lat && country.lon) {
      this.addPoint(parseFloat(country.lat), parseFloat(country.lon));
    }
  }

  addPoint(startLat, startLon) {
    let endLat = parseFloat(countries[this.currentCountry.toUpperCase()].lat);
    let endLon = parseFloat(countries[this.currentCountry.toUpperCase()].lon);

    let curve = this.getCurveFromCoords(startLat, startLon, endLat, endLon);
    let pipes = Math.floor(5*this.value) || 1;

    const geometry = new THREE.TubeBufferGeometry(curve, 20, this.value, pipes, false);
    const curveObject = new THREE.Line(geometry, this.material);

    this.scene.add(curveObject);
  }


  clamp(num, min, max) {
    return num <= min ? min : (num >= max ? max : num);
  }

// util function to convert lat/lng to 3D point on globe
  coordinateToPosition(lat, lng, radius) {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (180 - lng) * Math.PI / 180;

    return new THREE.Vector3(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  getCurveFromCoords(startLat, startLng, endLat, endLng) {
    // start and end points
    const start = this.coordinateToPosition(startLat, startLng, this.globeRadius);
    const end = this.coordinateToPosition(endLat, endLng, this.globeRadius);

    // altitude
    const altitude = this.clamp(start.distanceTo(end) * 0.75, this.minAltitude, this.maxAltitude);

    // 2 control points
    const interpolate = geoInterpolate([startLng, startLat], [endLng, endLat]);
    const midCoord1 = interpolate(0.25);
    const midCoord2 = interpolate(0.75);
    const mid1 = this.coordinateToPosition(midCoord1[1], midCoord1[0], this.globeRadius + altitude);
    const mid2 = this.coordinateToPosition(midCoord2[1], midCoord2[0], this.globeRadius + altitude);

    return new THREE.CubicBezierCurve3(start, mid1, mid2, end);
  }

  makeChart() {
    let maxSum;
    if (this.importSum > this.exportSum) maxSum = this.importSum;
    else maxSum = this.exportSum;
    this.importBar.style = `height: ${(this.importSum / maxSum) * this.height * 0.70}px`;
    this.exportBar.style = `height: ${(this.exportSum / maxSum) * this.height * 0.70}px`;
    this.importText.innerText = this.formatNum(this.importSum);
    this.exportText.innerText = this.formatNum(this.exportSum);
  }

  formatNum(num) {
    if (num >= 100000000) return `$${parseFloat(num / 1000000000, 10).toFixed(2)}B`;
    else if (num >= 100000) return `$${parseFloat(num / 1000000, 10).toFixed(2)}M`;
    else if (num >= 100) return `$${parseFloat(num / 1000, 10).toFixed(2)}K`;
    return 0;
  }
}