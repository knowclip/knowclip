import { unparse } from 'papaparse'

const exportCsv = (files, flashcards) => {
  const usableFlashcards = files
    .map(file => flashcards[file.name])
    .filter(({ de, en }) => de.trim() || en.trim())
    .map(({ en, de }, i) => [de, en, `[sound:${files[i].name}]`])
  // TODO: alert if no usable
  let csv = unparse(usableFlashcards)
  const filename = 'export.csv';
  console.log(csv)
  if (!csv.match(/^data:text\/csv/i)) {
      csv = 'data:text/csv;charset=utf-8,' + csv;
  }
  const data = encodeURI(csv);

  const link = document.createElement('a');
  link.setAttribute('href', data);
  link.setAttribute('download', filename);
  link.click();
}

export default exportCsv
