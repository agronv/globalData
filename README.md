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
  function addPoint(lat, lon) {
    let phi = (90 - lat) * Math.PI / 180;
    let theta = (180 - lon) * Math.PI / 180;

    point.position.x = 180 * Math.sin(phi) * Math.cos(theta);
    point.position.y = 180 * Math.cos(phi);
    point.position.z = 180 * Math.sin(phi) * Math.sin(theta);

    point.lookAt(mesh.position);
    point.updateMatrix();

    if (point.matrixAutoUpdate) {
        point.updateMatrix();
    }
    scene.add(point);
  }
```