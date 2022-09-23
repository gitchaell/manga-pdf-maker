const fs = require('fs');
const sizeOf = require('image-size');
const PDFDocument = require('pdfkit');
const inquirer = require('inquirer');


(() => selectMangas())();

function selectMangas() {

  const mangas = fs.readdirSync('./assets');

  if (!mangas.length)
    throw new Error(`Mangas not found. Process finished!`);

  inquirer.prompt([{
    type: 'checkbox',
    message: 'Select mangas',
    name: 'mangas',
    choices: mangas,
    validate: answer => answer.length < 1 ? 'You must choose at least one manga.' : true,
  }])
    .then(({ mangas }) => generatePDF(mangas));
}

function generatePDF(mangas) {

  const ui = new inquirer.ui.BottomBar();

  for (const manga of mangas) {

    const ASSETS_DIR = `./assets/${manga}/volumes`;
    const GENERATED_DIR = `./generated/${manga}/volumes`;

    fs.mkdirSync(GENERATED_DIR, { recursive: true });

    const volumes = fs.readdirSync(ASSETS_DIR);

    if (!volumes.length)
      throw new Error(`Volumes not found in Manga ${manga}. Process finished!`);

    inquirer.prompt([{
      type: 'checkbox',
      message: `Select volumes for Manga ${manga}`,
      name: 'volumes',
      choices: volumes,
      validate: answer => answer.length < 1 ? 'You must choose at least one volume.' : true,
    }])
      .then(({ volumes }) => {

        for (const volume of volumes) {

          const pdf = new PDFDocument({ autoFirstPage: false, layout: 'landscape', size: 'A4', margin: 0 });

          pdf.pipe(fs.createWriteStream(`${GENERATED_DIR}/${volume}.pdf`));

          const pages = fs.readdirSync(`${ASSETS_DIR}/${volume}`);

          if (!pages.length)
            throw new Error(`Pages not found in Manga ${manga} Vol. ${volume}`);

          const step = 8;

          if (pages.length % step)
            throw new Error(`Pages (${pages.length}) in Manga ${manga} Vol. ${volume} must be multiples of ${step}`);

          let i = 1;
          let j = step;
          let iBase = i;
          let jBase = j;
          let even = true;

          do {

            const firstImage = pages.at(i - 1);
            const lastImage = pages.at(j - 1);

            pdf.addPage();

            if (even) {

              const x = getXFor({ filePath: `${ASSETS_DIR}/${volume}/${firstImage}`, pageWidth: pdf.page.width, pageHeight: pdf.page.height });

              pdf.image(`${ASSETS_DIR}/${volume}/${lastImage}`, 0, 0, { height: pdf.page.height });
              pdf.image(`${ASSETS_DIR}/${volume}/${firstImage}`, x, 0, { height: pdf.page.height });
            } else {

              const x = getXFor({ filePath: `${ASSETS_DIR}/${volume}/${lastImage}`, pageWidth: pdf.page.width, pageHeight: pdf.page.height });

              pdf.image(`${ASSETS_DIR}/${volume}/${firstImage}`, 0, 0, { height: pdf.page.height });
              pdf.image(`${ASSETS_DIR}/${volume}/${lastImage}`, x, 0, { height: pdf.page.height });
            }

            ui.updateBottomBar(`Generating => Manga: ${manga}, Volume: ${volume}, Pages: ${i}/${pages.length}`);

            i++;
            j--;

            even = !even;

            if (i - j === 1) {
              iBase += step;
              jBase += step;

              if (iBase <= pages.length && jBase <= pages.length) {
                i = iBase;
                j = jBase;
              } else break;
            }

          } while (true);

          pdf.end();

        }

      });

  }

}

function getXFor({ filePath, pageWidth, pageHeight }) {

  const dimension = sizeOf(filePath);
  const widthBase = dimension.width;
  const heightBase = dimension.height;
  const widthTarget = pageHeight * widthBase / heightBase;

  const x = pageWidth - widthTarget;

  return x;
}