const { PDFDocument } = require('pdf-lib');

async function copyPages() {
  const url1 = 'https://pdf-lib.js.org/assets/with_update_sections.pdf'
  const url2 = 'https://pdf-lib.js.org/assets/with_large_page_count.pdf'

  const firstDonorPdfBytes = await fetch(url1).then(res => res.arrayBuffer())
  const secondDonorPdfBytes = await fetch(url2).then(res => res.arrayBuffer())

  const firstDonorPdfDoc = await PDFDocument.load(firstDonorPdfBytes)
  const secondDonorPdfDoc = await PDFDocument.load(secondDonorPdfBytes)

  const pdfDoc = await PDFDocument.create();

  const [firstDonorPage] = await pdfDoc.copyPages(firstDonorPdfDoc, [0])
  const [secondDonorPage] = await pdfDoc.copyPages(secondDonorPdfDoc, [742])

  pdfDoc.addPage(firstDonorPage)
  pdfDoc.insertPage(0, secondDonorPage)

  const pdfBytes = await pdfDoc.save()
}

copyPages();