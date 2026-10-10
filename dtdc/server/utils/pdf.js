// Generates the two customer/staff-facing PDFs: a booking receipt and a
// shipping label. Built with pdfkit (pure JS, no native dependencies).
//
// Note: pdfkit's standard 14 fonts don't include the Rupee sign (₹) glyph,
// so amounts are printed as "Rs." instead of ₹ to avoid missing-glyph boxes.
const PDFDocument = require('pdfkit');

const INK = '#142B6E';
const AMBER = '#E31E24';
const GREY = '#6B7280';
const LINE = '#E2E6EE';

function addressBlock(party) {
  return [party.name, party.address, `${party.city}, ${party.state} ${party.pincode || ''}`.trim(), party.phone]
    .filter(Boolean)
    .join('\n');
}

function kv(doc, x, y, label, value, width) {
  doc.fontSize(8).font('Helvetica-Bold').fillColor(GREY).text(label.toUpperCase(), x, y, { width });
  doc.fontSize(10.5).font('Helvetica').fillColor('#000000').text(value || '-', x, y + 12, { width, lineGap: 2 });
}

function hr(doc, y) {
  doc.moveTo(50, y).lineTo(545, y).strokeColor(LINE).lineWidth(1).stroke();
}

// ---------- Receipt (A4, customer-facing proof of booking) ----------
function generateReceiptPdf(parcel, destination) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(destination);

  doc.rect(0, 0, doc.page.width, 86).fill(INK);
  doc.fillColor('#FFFFFF').fontSize(18).font('Helvetica-Bold').text('DK Enterprise', 50, 26);
  doc.fontSize(9).font('Helvetica').fillColor('#C6CCDA').text('Courier & Cargo - Kudlu New Franchise, Bengaluru', 50, 49);
  doc.fontSize(13).font('Helvetica-Bold').fillColor(AMBER).text('BOOKING RECEIPT', 0, 34, { align: 'right', width: doc.page.width - 50 });

  doc.fontSize(8.5).font('Helvetica').fillColor(GREY)
    .text(`Issued ${new Date().toLocaleString('en-IN')}`, 50, 100, { align: 'right', width: 495 });

  let y = 122;
  doc.fontSize(9).font('Helvetica').fillColor(GREY).text('TRACKING ID', 50, y);
  doc.fontSize(20).font('Helvetica-Bold').fillColor(INK).text(parcel.trackingId, 50, y + 13);
  doc.roundedRect(400, y - 4, 145, 30, 3).lineWidth(1).strokeColor(LINE).stroke();
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000').text(parcel.status, 400, y + 6, { width: 145, align: 'center' });

  y += 62;
  hr(doc, y);
  y += 20;

  kv(doc, 50, y, 'From', addressBlock(parcel.sender), 220);
  kv(doc, 310, y, 'To', addressBlock(parcel.receiver), 220);

  y += 95;
  hr(doc, y);
  y += 20;

  kv(doc, 50, y, 'Service', parcel.serviceType === 'express' ? 'Express' : 'Standard', 110);
  kv(doc, 170, y, 'Weight', `${parcel.weightKg} kg`, 110);
  kv(doc, 290, y, 'Zone', parcel.zone, 110);
  kv(doc, 410, y, 'Booked On', new Date(parcel.createdAt).toLocaleDateString('en-IN'), 130);

  y += 50;
  hr(doc, y);
  y += 22;

  doc.fontSize(9).font('Helvetica').fillColor(GREY).text('AMOUNT', 50, y);
  doc.fontSize(24).font('Helvetica-Bold').fillColor(AMBER).text(`Rs. ${parcel.cost}`, 50, y + 14);

  if (parcel.branch) {
    doc.fontSize(9).font('Helvetica').fillColor(GREY).text('BOOKED AT', 310, y);
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000').text(`${parcel.branch.name}`, 310, y + 14);
    doc.fontSize(9.5).font('Helvetica').fillColor(GREY).text(`${parcel.branch.city || ''}`, 310, y + 30);
  }

  doc.fontSize(8).font('Helvetica').fillColor(GREY)
    .text('This is a system-generated receipt from DK Enterprise. For queries call +91 63661 18850.', 50, doc.page.height - 60, { width: 495, align: 'center' });

  doc.end();
}

// ---------- Shipping label / waybill (4in x 6in, for staff to print & attach) ----------
function generateLabelPdf(parcel, destination) {
  const doc = new PDFDocument({ size: [288, 432], margin: 0 });
  doc.pipe(destination);

  doc.rect(0, 0, 288, 46).fill(INK);
  doc.fillColor('#FFFFFF').fontSize(13).font('Helvetica-Bold').text('DK ENTERPRISE', 14, 10);
  doc.fontSize(8).font('Helvetica').fillColor('#C6CCDA').text('Courier & Cargo - Kudlu New Franchise', 14, 27);

  doc.roundedRect(210, 12, 64, 22, 3).fill(AMBER);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(INK)
    .text(parcel.serviceType === 'express' ? 'EXPRESS' : 'STANDARD', 210, 19, { width: 64, align: 'center' });

  let y = 58;
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(GREY).text('TRACKING ID', 14, y);
  doc.fontSize(16).font('Helvetica-Bold').fillColor(INK).text(parcel.trackingId, 14, y + 10, { width: 260 });

  y += 42;
  doc.moveTo(14, y).lineTo(274, y).strokeColor(LINE).lineWidth(1).stroke();
  y += 14;

  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(GREY).text('DELIVER TO', 14, y);
  doc.fontSize(12.5).font('Helvetica-Bold').fillColor('#000000').text(parcel.receiver.name, 14, y + 11, { width: 260 });
  doc.fontSize(10).font('Helvetica').fillColor('#000000')
    .text(parcel.receiver.address, 14, y + 27, { width: 260, lineGap: 1 });
  doc.fontSize(10).font('Helvetica-Bold')
    .text(`${parcel.receiver.city}, ${parcel.receiver.state} ${parcel.receiver.pincode || ''}`.trim(), 14, doc.y + 2, { width: 260 });
  doc.fontSize(10).font('Helvetica').text(`Ph: ${parcel.receiver.phone}`, 14, doc.y + 4, { width: 260 });

  y = doc.y + 18;
  doc.moveTo(14, y).lineTo(274, y).strokeColor(LINE).lineWidth(1).stroke();
  y += 12;

  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(GREY).text('FROM', 14, y);
  doc.fontSize(9.5).font('Helvetica').fillColor('#000000')
    .text(`${parcel.sender.name}, ${parcel.sender.city}, ${parcel.sender.state}`, 14, y + 10, { width: 260 });
  doc.text(`Ph: ${parcel.sender.phone}`, 14, doc.y + 2, { width: 260 });

  y = doc.y + 16;
  doc.rect(0, y, 288, 46).fill('#F3F5F9');
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(GREY).text('WEIGHT', 14, y + 8);
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000').text(`${parcel.weightKg} kg`, 14, y + 20);
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(GREY).text('ZONE', 110, y + 8);
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000').text(parcel.zone.toUpperCase(), 110, y + 20);
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(GREY).text('BOOKED', 205, y + 8);
  doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#000000').text(new Date(parcel.createdAt).toLocaleDateString('en-IN'), 205, y + 21);

  doc.fontSize(7).font('Helvetica').fillColor(GREY)
    .text('Handle with care - track at any time using the tracking ID above.', 14, 412, { width: 260, align: 'center' });

  doc.end();
}

module.exports = { generateReceiptPdf, generateLabelPdf };
