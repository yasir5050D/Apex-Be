const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = process.env.UPLOADS_DIR || 'uploads';
const ASSETS_DIR = process.env.ASSETS_DIR || 'assets';
const LOGO_FILENAME = process.env.LOGO_FILENAME || 'logo.png';

function addLabelValue(doc, label, value, x, y, labelWidth = 150) {
  doc.font('Helvetica-Bold').fontSize(11).text(label, x, y);
  doc.font('Helvetica').fontSize(11).text(value || '__________________________', x + labelWidth, y);
}

module.exports = function generateFranchisePDF(formData, franchiseId) {
  return new Promise((resolve, reject) => {
    try {
      const filename = `franchise_${franchiseId}.pdf`;
      const filepath = path.join(UPLOADS_DIR, filename);
      const doc = new PDFDocument({ margin: 40, size: 'A4' });

      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Header area (logo + headings)
      const logoPath = path.join(ASSETS_DIR, LOGO_FILENAME);
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, 30, { width: 40 });
      }

      doc.fontSize(10).font('Helvetica-Bold')
         .text('UDYAM Reg. No: UDYAM-JK-20-0012284', 130, 30, { align: 'right' });

      doc.moveDown(1);
      doc.fontSize(16).font('Helvetica-Bold').text('Career Ready J&K Online Academy', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text('Abacus Learning Program', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('gray').text('Web: www.careerreadyjk.live   Mail: careerready92@gmail.com   Mob: +91 9797240115, 7889469804', { align: 'center' });
      doc.moveDown(1);
      doc.moveTo(40, 110).lineTo(555, 110).stroke();

      // Title
      doc.moveDown(1);
      doc.fontSize(13).fillColor('black').font('Helvetica-Bold')
         .text('District/Unit Franchise Application Form', { align: 'center' });
      doc.moveDown(0.5);

      // Section: Applicant Details
      let y = doc.y + 10;
      doc.fontSize(12).font('Helvetica-Bold').text('1. Applicant Details', 40, y);
      y += 20;

      addLabelValue(doc, 'Name of Applicant:', formData.fullName, 40, y);
      addLabelValue(doc, "Father's Name:", formData.fatherName, 320, y);
      y += 20;

      addLabelValue(doc, 'Date of Birth:', formData.dob, 40, y);
      addLabelValue(doc, 'Gender:', formData.gender, 320, y);
      y += 20;

      addLabelValue(doc, 'Aadhaar No.:', formData.aadhar || formData.aadhar, 40, y);
      addLabelValue(doc, 'PAN No.:', formData.pan, 320, y);
      y += 20;

      doc.text('Residential Address:', 40, y, { continued: false });
      doc.font('Helvetica').text(formData.address || '', 40, y + 15, { width: 480 });
      y = doc.y + 25;

      addLabelValue(doc, 'District:', formData.district, 40, y);
      addLabelValue(doc, 'State:', formData.state, 320, y);
      y += 20;

      addLabelValue(doc, 'Pin Code:', formData.pincode, 40, y);
      addLabelValue(doc, 'Contact Number:', formData.mobile, 320, y);
      y += 20;

      addLabelValue(doc, 'Email ID:', formData.email, 320, y);
      y += 30;

      // Section: Centre Details
      doc.font('Helvetica-Bold').fontSize(12).text('2. Centre Details', 40, y);
      y += 20;
      addLabelValue(doc, 'Proposed Centre Name:', formData?.proposedCentreName || 'Abacus Learning Centre', 40, y);
      y += 20;
      addLabelValue(doc, 'Centre Address:', formData?.centreAddress, 40, y);
      addLabelValue(doc, 'Pin Code:', formData?.centrePincode, 320, y);
      y += 30;

      // Section: Proposed Franchise Details
      doc.font('Helvetica-Bold').text('3. Proposed Franchise Details', 40, y);
      y += 18;
      doc.font('Helvetica').text('Why do you want to start Abacus Learning Program District/Unit Franchise?', 40, y);
      y += 16;
      doc.font('Helvetica').text(formData?.motivation || '', 40, y, { width: 500 });
      y = doc.y + 20;

      doc.font('Helvetica').text('Target Area for Students (Locality/Villages/Town/City):', 40, y);
      y += 16;
      doc.font('Helvetica').text(formData?.targetArea || '', 40, y, { width: 500 });
      y = doc.y + 20;

      addLabelValue(doc, 'Expected No. of Students in First 6 Months:', formData?.expectedStudentsFirst6Months, 40, y);
      addLabelValue(doc, 'Preferred Start Date:', formData?.preferredStartDate, 320, y);
      y += 30;

      // Section: Documents to be Attached
      doc.font('Helvetica-Bold').text('4. Documents to be Attached', 40, y);
      y += 18;
      const docLines = [
        'Aadhaar Card Copy',
        'PAN Card Copy',
        'Passport-size Photograph (2)',
        'Address Proof of Centre',
        'Any Govt. Registration Proof (Optional)'
      ];
      doc.font('Helvetica').fontSize(11);
      docLines.forEach((line, idx) => {
        doc.text(`☐ ${line}`, 50, y);
        y += 14;
      });
      y += 10;

      // Divider and Declaration
      doc.moveTo(40, y).lineTo(555, y).stroke();
      y += 10;
      doc.font('Helvetica-Bold').text('5. Declaration', 40, y);
      y += 18;
      const declarationText = 'I hereby declare that all information provided above is true to the best of my knowledge. I agree to abide by all rules, policies, and operational guidelines of the Abacus Learning Program Powered by Career Ready J&K.';
      doc.font('Helvetica').fontSize(11).text(declarationText, 40, y, { width: 500 });
      y = doc.y + 30;

      // signature area
      doc.text('Signature of Applicant: ____________________', 40, y);
      doc.text('Date: ____________________', 350, y);
      y += 60;

      // Office use only block
      doc.moveTo(40, y).lineTo(555, y).stroke();
      y += 8;
      doc.font('Helvetica-Bold').text('For Office Use Only', 40, y);
      y += 20;
      doc.text('Centre Code.: __________________________________________ ', 40, y);
      y += 16;
      doc.text('Centre Name.:__________________________________________ ', 40, y);
      y += 16;
      doc.text('Date of Receipt: _________________________', 40, y);
      y += 16;
      doc.text('Verified By: _____________________________', 40, y);
      y += 16;
      doc.text('Status:  ☐ Rejected  ☐ Pending ☐ Approved', 40, y);
      y += 16;
      doc.text('Remarks: _________________________________________', 40, y);

      // footer
      doc.moveTo(40, 770).lineTo(555, 770).stroke();
      doc.fontSize(9).fillColor('gray').text('Career Ready J&K • Web: www.careerreadyjk.live • Mail: careerready92@gmail.com', 40, 775);

      doc.end();

      stream.on('finish', () => {
        resolve({ filename, filepath });
      });
      stream.on('error', err => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};
