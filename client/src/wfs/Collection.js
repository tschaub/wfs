function Collection(meta, root) {
  this.meta = meta;
  this.root = root;
}

Collection.prototype.getFeaturesLink = function() {
  let link = null;
  for (let i = 0, ii = this.meta.links.length; i < ii; ++i) {
    const candidate = this.meta.links[i];
    // TODO: check spec about vs. item
    if (candidate.rel === 'about' || candidate.rel === 'item') {
      if (candidate.type === 'application/geo+json') {
        link = candidate;
        break;
      }
    }
  }
  return link;
};

function deslash(url) {
  if (url.endsWith('/')) {
    return url.slice(0, -1);
  }
  return url;
}

Collection.prototype.getHackedFeaturesLink = function() {
  const id = this.meta.collectionId || this.meta.name;
  const href = `${deslash(this.root)}/${id}`;
  return {
    href,
    type: 'application/geo+json',
    rel: 'item'
  };
};

Collection.prototype.getFeatures = async function() {
  const link = this.getHackedFeaturesLink(); // this.getFeaturesLink();
  if (!link) {
    throw new Error('Unable to get link for features');
  }

  const response = await fetch(link.href, {
    headers: {
      accept: link.type
    }
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Unexpected status: ${response.status}`);
  }
  return await response.json();
};

export default Collection;
