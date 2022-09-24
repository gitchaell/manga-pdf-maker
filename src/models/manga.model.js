const fs = require('fs');
const Volume = require('./volume.model');

class Manga {
  constructor (name, path) {
    this.name = name;
    this.path = `${path}/${this.name}/volumes`;
    this.outputPath = `./generated/${this.name}/volumes`;
  }

  volume(volumeName) {
    return new Volume(volumeName, this.path);
  }

  get volumeNames() {

    const volumeNames = fs.readdirSync(this.path);

    if (!volumeNames.length)
      throw new Error(`Volumes not found in ${this.path}`);

    return volumeNames;
  }

  prepareOutputPath() {
    fs.mkdirSync(this.outputPath, { recursive: true });
  }
}

module.exports = Manga;