const PDFDocument = require('pdfkit');
const fs = require('fs');
const ProgressBar = require('progress');


const MANGAS = ['dragon-ball-artbook', 'dragon-ball-super', 'jaco-patrullero-galactico'];

try {

  for (const MANGA of MANGAS) {

    console.log(`\nProcessing Manga ${MANGA}\n`);

    const ASSETS_DIR = `./assets/${MANGA}/volumes`;
    const GENERATED_DIR = `./generated/${MANGA}/volumes`;

    const volumeNames = fs.readdirSync(ASSETS_DIR);

    if (!volumeNames.length) {
      throw new Error(`Volumes not found. Process finished!`);
    }

    for (const volumeName of volumeNames) {

      const pdf = new PDFDocument({ autoFirstPage: false, layout: 'landscape', size: 'A4', margin: 0 });

      pdf.pipe(fs.createWriteStream(`${GENERATED_DIR}/${volumeName}.pdf`));

      const pageNames = fs.readdirSync(`${ASSETS_DIR}/${volumeName}`);

      if (!pageNames.length) continue;

      const loader = new ProgressBar('  Volume :volumeName [:bar] :rate/bps :percent', { total: pageNames.length });

      let i = 0;
      let j = pageNames.length - 1;
      let even = true;

      do {

        const firstImage = pageNames.at(i);
        const lastImage = pageNames.at(j);

        pdf.addPage();
        const imageWidth = pdf.page.width / 2;
        const fit = [imageWidth, pdf.page.height];

        if (even) {
          pdf.image(`${ASSETS_DIR}/${volumeName}/${lastImage}`, 0, 0, { fit });
          pdf.image(`${ASSETS_DIR}/${volumeName}/${firstImage}`, imageWidth, 0, { fit });
        } else {
          pdf.image(`${ASSETS_DIR}/${volumeName}/${firstImage}`, 0, 0, { fit });
          pdf.image(`${ASSETS_DIR}/${volumeName}/${lastImage}`, imageWidth, 0, { fit });
        }

        i++;
        j--;

        even = !even;

        loader.tick(2, { volumeName });

      } while (i < j);

      pdf.end();

      loader.terminate();

    }

  }

} catch (err) {
  console.error(err);
}