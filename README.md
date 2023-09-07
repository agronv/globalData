# globalData

[Live Demo][linky]

[linky]: https://agronv.github.io/globalData/

## Overview 
globalData is a 3d visualization of trade between countries. Users are able to filter results by country, year, and product.

## Functionality & MVP
1. Users will be able to view and interact with a 3d model of the globe 
2. Users will be able to see the quantity at which countries are importing and exporting goods through bars on the globe
3. Users will be able to search by country, year, and product.

## Technologies & Libraries 
1. Three.js
3. Atlas.media api 
4. Vanilla JavaScript

<br/>

![gif](/globey.gif)

## Adding data point to globe
  Data bars are not directly attached to the globe when data is added. Instead,
  a bar is created at a given coordinate that corresponds to a point on the globe.
  This bar is then set to be perpendicular to the surface of the globe.

```javascript
  getCurveFromCoords(startLat, startLng, endLat, endLng) {
    const start = this.coordinateToPosition(startLat, startLng, this.globeRadius);
    const end = this.coordinateToPosition(endLat, endLng, this.globeRadius);

    const altitude = this.clamp(start.distanceTo(end) * 0.75, this.minAltitude, this.maxAltitude);

    const interpolate = geoInterpolate([startLng, startLat], [endLng, endLat]);
    const midCoord1 = interpolate(0.25);
    const midCoord2 = interpolate(0.75);
    const mid1 = this.coordinateToPosition(midCoord1[1], midCoord1[0], this.globeRadius + altitude);
    const mid2 = this.coordinateToPosition(midCoord2[1], midCoord2[0], this.globeRadius + altitude);

    return new THREE.CubicBezierCurve3(start, mid1, mid2, end);
  }

  coordinateToPosition(lat, lng, radius) {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (180 - lng) * Math.PI / 180;

    return new THREE.Vector3(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }
```

## Getting started
* this is a note to self on how to start working on this project again if you ever need to work on it again
* install git on computer and git-cli
* install vscode if vscode is needed
* `git clone` project
* install npm
* go to project location
* run `npm install`, if there are vulnerablities, run install --force and audit
* if there are further issues. update your version of webpack, webpack-cli, webpack webpack-dev-server
* run `npm start` to watch project for any changes. this will automatically change your bundle.js
* run  `npm run server` to start server and launch localhost on web browser
* in order to deploy changes make sure bundle.js has been updated
* commit changes to gh-pages branch and push up updated gh-pages branch
* changes will automatically be deployed
