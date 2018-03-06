import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import OSM from 'ol/source/OSM.js';
import GeoJSON from 'ol/format/GeoJSON';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';

const root =
  process.env.NODE_ENV === 'production' ? '/wfs' : 'http://localhost:8080/wfs';

const source = new VectorSource();

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM()
    }),
    new VectorLayer({
      source: source
    })
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

const format = new GeoJSON({featureProjection: map.getView().getProjection()});

async function getFeatures(collectionId) {
  const url = `${root}/${collectionId}`;
  const response = await fetch(url, {
    headers: {
      accept: 'application/json'
    }
  });
  return await response.json();
}

async function getCollections() {
  const response = await fetch(root, {
    headers: {
      accept: 'application/json'
    }
  });
  return await response.json();
}

async function main() {
  const info = await getCollections();
  const control = document.getElementById('collection');

  let collectionId = location.search
    .slice(1)
    .split('=')
    .pop();

  info.collections.forEach(collection => {
    const option = document.createElement('option');
    option.selected = collectionId === collection.name;
    option.value = collection.name;
    option.text = collection.title;
    control.appendChild(option);
  });

  if (!collectionId) {
    collectionId = info.collections[0].name;
  }

  control.onchange = event => {
    location.search = `collection=${event.target.value}`;
  };

  const json = await getFeatures(collectionId);
  const features = format.readFeatures(json);
  source.addFeatures(features);
  map.getView().fit(source.getExtent(), {duration: 500});
}

main();
