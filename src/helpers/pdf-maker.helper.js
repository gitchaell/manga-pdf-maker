const fs = require('fs');
const PDFDocument = require('pdfkit');
const inquirer = require('inquirer');

const Manga = require('../models/manga.model');


class PDFMaker {
  constructor () {
    this.path = `./assets`;
    this.log = new inquirer.ui.BottomBar();
    return this;
  }

  get mangaNames() {

    const mangaNames = fs.readdirSync(this.path);

    if (!mangaNames.length)
      throw new Error(`Mangas not found in ${this.path}`);

    return mangaNames;
  }

  execute() {

    inquirer
      .prompt([{
        type: 'list',
        message: 'Select Manga',
        name: 'mangaName',
        choices: this.mangaNames,
      }])
      .then(({ mangaName }) => this.onSelectManga(mangaName))
      .catch(console.error);
  }

  onSelectManga(mangaName) {

    const manga = new Manga(mangaName, this.path);

    manga.prepareOutputPath();

    inquirer
      .prompt([{
        type: 'checkbox',
        message: `Manga ${manga.name}. Select Volumes`,
        name: 'volumeNames',
        choices: manga.volumeNames,
        validate: answer => answer.length < 1 ? 'You must choose at least one volume.' : true,
      }])
      .then(({ volumeNames }) => this.onSelectVolumes(manga, volumeNames))
      .catch(console.error);
  }

  onSelectVolumes(manga, volumeNames) {

    for (const volumeName of volumeNames) {

      const volume = manga.volume(volumeName);

      const pdf = new PDFDocument({
        autoFirstPage: false,
        layout: 'landscape',
        size: 'A4',
        margin: 0,
      });

      pdf.pipe(fs.createWriteStream(volume.outputPath));

      const images = volume.images;

      let i = 1;
      let j = volume.step;
      let iBase = i;
      let jBase = j;
      let even = true;

      do {

        pdf.addPage();

        const aImage = images.at(i - 1);
        const bImage = images.at(j - 1);
        const fitImage = { height: pdf.page.height };

        if (even) {
          pdf.image(bImage.path, 0, 0, fitImage);
          pdf.image(aImage.path, aImage.x(pdf.page), 0, fitImage);
        } else {
          pdf.image(aImage.path, 0, 0, fitImage);
          pdf.image(bImage.path, bImage.x(pdf.page), 0, fitImage);
        }

        i++;
        j--;

        even = !even;

        this.log.updateBottomBar(`Loading (${i}/${images.length})... ${volume.path}`);

        if (i - j === 1) {
          iBase += volume.step;
          jBase += volume.step;

          if (iBase <= images.length && jBase <= images.length) {
            i = iBase;
            j = jBase;
          } else break;
        }

      } while (true);

      pdf.end();

    }
  }
}

module.exports = PDFMaker;