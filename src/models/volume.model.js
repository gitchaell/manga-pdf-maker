const fs = require('fs');
const Image = require('./image.model');

class Volume {

  constructor (name, path) {
    this.name = name;
    this.path = `${path}/${name}`;
    this.step = 8;
    this.outputPath = `./generated/${this.name}/volumes/${this.name}.pdf`;
  }

  get images() {

    const imageNames = fs.readdirSync(this.path);

    if (!imageNames.length)
      throw new Error(`Images not found in ${this.path}`);

    if (imageNames.length % this.step)
      throw new Error(`Images (${images.length}) in ${this.path} must be multiples of ${this.step}`);

    return imageNames.map(imageName => new Image(imageName, this.path));
  }
}

module.exports = Volume;