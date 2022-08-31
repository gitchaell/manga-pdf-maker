const cliProgress = require('cli-progress');
const logger = require('pino')(require('pino-pretty')());
const PDFDocument = require('pdfkit');
const fs = require('fs');


const MANGA_NAME = 'dragon-ball-super';
const ASSETS_DIR = `./assets/${MANGA_NAME}/volumes`;
const GENERATED_DIR = `./generated/${MANGA_NAME}`;
const GENERATED_NAME = `${GENERATED_DIR}/${new Date().getTime()}.manga.pdf`;

const loadingLogger = new cliProgress.MultiBar({
  format: 'Volume {volumeName} [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}',
  clearOnComplete: false,
  hideCursor: true
}, cliProgress.Presets.legacy);

try {

  if (!fs.existsSync(ASSETS_DIR)) {
    throw new Error('No hay tomos agregados al folder assets');
  }

  const volumeNames = fs.readdirSync(ASSETS_DIR);

  if (!volumeNames.length) {
    throw new Error(`No se encontraron tomos. Proceso terminado!`);
  }

  const pdf = new PDFDocument({ autoFirstPage: false, layout: 'landscape', size: 'A4', margin: 0 });

  pdf.pipe(fs.createWriteStream(GENERATED_NAME));

  for (const volumeName of volumeNames) {

    const pageNames = fs.readdirSync(`${ASSETS_DIR}/${volumeName}`);

    if (!pageNames.length) continue;

    const loader = loadingLogger.create(pageNames.length, 0, { volumeName });

    let i = 0;
    let j = pageNames.length - 1;
    let loadValue = 0;
    let even = true;

    do {

      const firstPageName = pageNames.at(i);
      const lastPageName = pageNames.at(j);

      pdf.addPage();
      const imageWidth = pdf.page.width / 2;
      const fit = [imageWidth, pdf.page.height];

      if (even) {
        pdf.image(`${ASSETS_DIR}/${volumeName}/${lastPageName}`, 0, 0, { fit });
        pdf.image(`${ASSETS_DIR}/${volumeName}/${firstPageName}`, imageWidth, 0, { fit });
      } else {
        pdf.image(`${ASSETS_DIR}/${volumeName}/${firstPageName}`, 0, 0, { fit });
        pdf.image(`${ASSETS_DIR}/${volumeName}/${lastPageName}`, imageWidth, 0, { fit });
      }

      i++;
      j--;

      even = !even;

      loadValue += 2;

      loader.update(loadValue);

    } while (i < j);

  }

  pdf.end();

  loadingLogger.stop();

} catch (err) {
  logger.error(err.message);
}