const sizeOf = require('image-size');

class Image {

  constructor (name, path) {
    this.name = name;
    this.path = `${path}/${name}`;

    const dimensions = sizeOf(this.path);

    this.width = dimensions.width;
    this.height = dimensions.height;
  }

  x({ width, height }) {
    const widthFit = height * this.width / this.height;
    return width - widthFit;
  }
}

module.exports = Image;