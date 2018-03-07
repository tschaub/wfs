import Collection from './Collection';

function Service(meta, root) {
  this.meta = meta;
  this.root = root;
}

Service.prototype.getCollectionByName = function(name) {
  let collection = null;
  for (let i = 0, ii = this.meta.collections.length; i < ii; ++i) {
    const meta = this.meta.collections[i];
    // TODO: check spec name vs. collectionId
    if (meta.name === name || meta.collectionId === name) {
      collection = new Collection(meta, this.root);
    }
  }
  return collection;
};

export default Service;

export async function getService(root) {
  const response = await fetch(root, {
    headers: {
      accept: 'application/json'
    }
  });
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Unexpected status for service: ${response.status}`);
  }
  const meta = await response.json();
  return new Service(meta, root);
}
