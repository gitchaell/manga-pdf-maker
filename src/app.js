const PDFDocument = require('pdfkit');
const fs = require('fs');
const ProgressBar = require('progress');


// const MANGAS = ['dragon-ball-artbook', 'dragon-ball-super', 'jaco-patrullero-galactico'];
const MANGAS = ['dragon-ball-super'];

try {

  for (const MANGA of MANGAS) {

    console.log(`\nProcessing Manga ${MANGA}\n`);

    const ASSETS_DIR = `./assets/${MANGA}/volumes`;
    const GENERATED_DIR = `./generated/${MANGA}/volumes`;

    const volumes = fs.readdirSync(ASSETS_DIR);

    if (!volumes.length) {
      throw new Error(`Volumes not found. Process finished!`);
    }

    for (const volume of volumes) {

      const pdf = new PDFDocument({ autoFirstPage: false, layout: 'landscape', size: 'A4', margin: 0 });

      pdf.pipe(fs.createWriteStream(`${GENERATED_DIR}/${volume}.pdf`));

      const pages = fs.readdirSync(`${ASSETS_DIR}/${volume}`);

      if (!pages.length) {
        throw new Error(`Pages not found in Volume: ${volume}`);
      }

      if (pages.length % 4) {
        throw new Error(`Total number of pages in Volume ${volume} (${pages.length}) must be multiples of 4`);
      }

      const loader = new ProgressBar('  Volume :volume [:bar] :rate/bps :percent', { total: pages.length });

      let i = 1;
      let j = 16;
      let iBase = i;
      let jBase = j;
      let even = true;

      do {

        const firstImage = pages.at(i - 1);
        const lastImage = pages.at(j - 1);

        pdf.addPage();
        const imageWidth = pdf.page.width / 2;
        const fit = [imageWidth, pdf.page.height];

        if (even) {
          pdf.image(`${ASSETS_DIR}/${volume}/${lastImage}`, 0, 0, { fit });
          pdf.image(`${ASSETS_DIR}/${volume}/${firstImage}`, imageWidth, 0, { fit });
        } else {
          pdf.image(`${ASSETS_DIR}/${volume}/${firstImage}`, 0, 0, { fit });
          pdf.image(`${ASSETS_DIR}/${volume}/${lastImage}`, imageWidth, 0, { fit });
        }

        i++;
        j--;

        even = !even;

        loader.tick(2, { volume });

        if (i - j === 1) {
          iBase += 16;
          jBase += 16;

          if (iBase <= pages.length && jBase <= pages.length) {
            i = iBase;
            j = jBase;
          } else break;
        }

      } while (true);

      pdf.end();

      loader.terminate();

    }

  }

} catch (err) {
  console.error(err);
}