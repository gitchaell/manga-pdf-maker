const cliProgress = require('cli-progress');
const logger = require('pino')(require('pino-pretty')());
const PDFDocument = require('pdfkit');
const fs = require('fs');


const MANGA_NAME = 'dragon-ball-super';
const ASSETS_DIR = `./assets/${MANGA_NAME}/volumes`;
const GENERATED_DIR = `./generated/${MANGA_NAME}/volumes`;

const loadingLogger = new cliProgress.MultiBar({
  format: 'Volume {volumeName}.pdf [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}',
  clearOnComplete: false,
  hideCursor: true
}, cliProgress.Presets.legacy);

try {

  const volumeNames = fs.readdirSync(ASSETS_DIR);

  if (!volumeNames.length) {
    throw new Error(`Volumes not found. Process finished!`);
  }

  for (const volumeName of volumeNames) {

    const pdf = new PDFDocument({ autoFirstPage: false, layout: 'landscape', size: 'A4', margin: 0 });

    pdf.pipe(fs.createWriteStream(`${GENERATED_DIR}/${volumeName}.pdf`));

    const pageNames = fs.readdirSync(`${ASSETS_DIR}/${volumeName}`);

    if (!pageNames.length) continue;

    const loader = loadingLogger.create(pageNames.length, 0, { volumeName });

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

      loader.increment(2);

    } while (i < j);

    pdf.end();

  }

  loadingLogger.stop();

} catch (err) {
  logger.error(err.message);
}