import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import XYZ from 'ol/source/XYZ.js';
import GeoJSON from 'ol/format/GeoJSON';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import {getService} from './wfs/Service';

const source = new VectorSource();

const map = new Map({
  layers: [
    new TileLayer({
      source: new XYZ({
        url:
          'https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoicGxhbmV0IiwiYSI6ImJXOFA0UVUifQ.SKr9hJIQplCAhwcwxSZlfA'
      })
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

async function main() {
  const url =
    process.env.NODE_ENV === 'production'
      ? '/wfs'
      : 'http://localhost:8080/wfs';

  const service = await getService(url);
  const control = document.getElementById('collection');

  let collectionId = location.search
    .slice(1)
    .split('=')
    .pop();

  service.meta.collections.forEach(meta => {
    const option = document.createElement('option');
    // TODO: check spec collectionId vs name
    const candidateId = meta.collectionId || meta.name;
    option.selected = collectionId === candidateId;
    option.value = candidateId;
    option.text = meta.title;
    control.appendChild(option);
  });

  if (!collectionId) {
    const first = service.meta.collections[0];
    // TODO: check spec collectionId vs name
    collectionId = first.collectionId || first.name;
  }

  control.onchange = event => {
    location.search = `collection=${event.target.value}`;
  };

  const collection = service.getCollectionByName(collectionId);
  if (!collection) {
    throw new Error(`Collection "${collectionId}" not found`);
  }

  const json = await collection.getFeatures();
  const features = format.readFeatures(json);
  source.addFeatures(features);
  map.getView().fit(source.getExtent(), {duration: 500});
}

main();
