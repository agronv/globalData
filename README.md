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

![restaurant_search](/globalData.png)

## Adding data point to globe
  Data bars are not directly attached to the globe when data is added. Instead,
  a bar is created at a given coordinate that corresponds to a point on the globe.
  This bar is then set to be perpendicular to the surface of the globe.

```javascript
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