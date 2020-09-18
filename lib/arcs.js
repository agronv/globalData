import * as THREE from 'three';
import countries from './countries.js';
import { geoInterpolate } from 'd3-geo';

export default class Arcs {
  constructor(scene, globeRadius, height, noData, shifter) {
    this.scene = scene;
    this.height = height;
    this.noData = noData;
    this.minAltitude = 20;
    this.maxAltitude = 200;
    this.globeRadius = globeRadius;
    this.shifter = shifter
    
    this.importBar = document.getElementById("import-bar");
    this.exportBar = document.getElementById("export-bar");
    this.importText = document.getElementById("import-text");
    this.exportText = document.getElementById("export-text");

    this.addPoint = this.addPoint.bind(this);
    this.makeChart = this.makeChart.bind(this);
    this.createArcs = this.createArcs.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    this.importOrExport = this.importOrExport.bind(this);
    this.getCurveFromCoords = this.getCurveFromCoords.bind(this);

    window.addEventListener("resize", this.onWindowResize, false);
  }

  createArcs(importData, exportData, currentCountry) {
    this.currentCountry = currentCountry;

    this.exportSum = 0;
    this.importSum = 0;

    if (!importData.length && !exportData.length) this.noData.className = "no-data-active";

    importData.forEach( country => {
      this.importOrExport(country.PartnerEconomyCode, country.Value, true);
      this.importSum += country.Value;
    })

    exportData.forEach( country => {
      this.importOrExport(country.ReportingEconomyCode, country.Value, false);
      this.exportSum += country.Value;
    })

    this.makeChart();
  }

  importOrExport(countryId, rawValue, imported) {
    this.value = Math.pow(rawValue, 0.5) * 0.0003;
    if (this.value > 12) this.value = 12;
    if (this.value < 0.01) this.value = 0.01;

    if (imported) this.material = new THREE.LineBasicMaterial({ color: "#18FBFF" });
    else this.material = new THREE.LineBasicMaterial({ color: "#FF33E0" });

    const country = countries[countryId];
    if (country && country.lat && country.long) {
      this.addPoint(parseFloat(country.lat), parseFloat(country.long));
    }
  }

  addPoint(startLat, startLong) {
    let endLat = parseFloat(countries[this.currentCountry].lat);
    let endLong = parseFloat(countries[this.currentCountry].long);

    let curve = this.getCurveFromCoords(startLat, startLong, endLat, endLong);
    let pipes = Math.floor(5*this.value) || 1;

    const geometry = new THREE.TubeBufferGeometry(curve, 50, this.value, pipes, false);
    const curveObject = new THREE.Line(geometry, this.material);

    this.scene.add(curveObject);
  }
    
  clamp(num, min, max) {
    return num <= min ? min : (num >= max ? max : num);
  }

  coordinateToSphere(lat, long, radius) {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (180 - long) * Math.PI / 180;

    return new THREE.Vector3(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  getCurveFromCoords(startLat, startLong, endLat, endLong) {
    const start = this.coordinateToSphere(startLat, startLong, this.globeRadius);
    const end = this.coordinateToSphere(endLat, endLong, this.globeRadius);

    const altitude = this.clamp(start.distanceTo(end) * 0.75, this.minAltitude, this.maxAltitude);

    const interpolate = geoInterpolate([startLong, startLat], [endLong, endLat]);
    const midCoord1 = interpolate(0.25);
    const midCoord2 = interpolate(0.75);
    const mid1 = this.coordinateToSphere(midCoord1[1], midCoord1[0], this.globeRadius + altitude);
    const mid2 = this.coordinateToSphere(midCoord2[1], midCoord2[0], this.globeRadius + altitude);

    return new THREE.CubicBezierCurve3(start, mid1, mid2, end);
  }

  makeChart() {
    const importVal = (Math.pow(this.importSum, 0.35) * 0.00012 > 1) ? 1 : Math.pow(this.importSum, 0.35) * 0.00012;
    const exportVal = (Math.pow(this.exportSum, 0.35) * 0.00012 > 1) ? 1 : Math.pow(this.exportSum, 0.35) * 0.00012;
    this.importBar.style = `height: ${(importVal) * this.height * 0.70}px`;
    this.exportBar.style = `height: ${(exportVal) * this.height * 0.70}px`;
    this.importText.innerText = this.formatNum(this.importSum);
    this.exportText.innerText = this.formatNum(this.exportSum);
  }

  formatNum(num) {
    if (num >= 1000000000) return `$${parseFloat(num / 1000000000, 10).toFixed(1)}B`;
    else if (num >= 1000000) return `$${parseFloat(num / 1000000, 10).toFixed(1)}M`;
    else if (num >= 1000) return `$${parseFloat(num / 1000, 10).toFixed(1)}K`;
    return 0;
  }

  onWindowResize(e) {
    this.height = window.innerHeight + this.shifter;
    this.makeChart();
  }
}
