const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const UPLOADS_DIR = process.env.UPLOADS_DIR || "uploads";
const ASSETS_DIR = process.env.ASSETS_DIR || "assets";
const LOGO_FILENAME = process.env.LOGO_FILENAME || "logo.png";

module.exports = function generateFranchisePDF(formData, franchiseId) {
  return new Promise((resolve, reject) => {
    try {
      const filename = `franchise_${franchiseId}.pdf`;
      const filepath = path.join(UPLOADS_DIR, filename);

      const doc = new PDFDocument({
        size: "A4",
        margin: 40,
      });

      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // ---------- HEADER ----------
      const logoPath = path.join(ASSETS_DIR, LOGO_FILENAME);
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, 25, { width: 50 });
      }

      doc.fontSize(10)
        .font("Helvetica-Bold")
        .text("UDYAM Reg. No: UDYAM-JK-20-0012284", 130, 32, {
          align: "right",
        });

      doc.moveDown(1.5);

      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("Career Ready J&K Online Academy", { align: "center" });

      doc
        .moveDown(0.3)
        .fontSize(12)
        .font("Helvetica")
        .text("Abacus Learning Program", { align: "center" });

      doc
        .moveDown(0.3)
        .fontSize(10)
        .fillColor("gray")
        .text(
          "www.careerreadyjk.live | careerready92@gmail.com | +91 9797240115, 7889469804",
          { align: "center" }
        );

      doc.fillColor("black");
      doc.moveTo(40, 130).lineTo(555, 130).stroke();

      doc.moveDown(3.5);

      // ----------- TITLE -------------
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("District/Unit Franchise Application Form", {
          align: "center",
        });

      doc.moveDown(2);

      // Utility Row Function
      const row = (label, value) => {
        doc
          .fontSize(12)
          .font("Helvetica-Bold")
          .text(label, { continued: true })
          .font("Helvetica")
          .text(` ${value || "____________________________"}`);
      };

      // ------------- 1. Applicant Details --------------
      doc
        .moveDown(1)
        .fontSize(13)
        .font("Helvetica-Bold")
        .text("1. Applicant Details", { underline: true });

      doc.moveDown(1);

      row("Name of Applicant:", formData.fullName);
      row("Father’s Name:", formData.fatherName);
      row("Date of Birth:", formData.dob);
      row("Gender:", formData.gender);
      row("Aadhaar No.:", formData.aadhar);
      row("PAN No.:", formData.pan);

      doc
        .font("Helvetica-Bold")
        .text("Residential Address:", { continued: false });
      doc
        .font("Helvetica")
        .text(formData.address || "_________________________________________");

      row("District:", formData.district);
      row("State:", formData.state);
      row("Pin Code:", formData.pincode);
      row("Contact Number:", formData.mobile);
      row("Alt No.:", formData.alternateMobile);
      row("Email ID:", formData.email);

      doc.addPage(); // PAGE 2

      // ------------- 2. Centre Details --------------
      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .text("2. Centre Details", { underline: true });

      doc.moveDown(1);

      row("Proposed Centre Name:", "Abacus Learning Centre");
      row("Centre Address:", formData.address);
      row("Pin Code:", formData.pincode);

      doc.moveDown(1.5);

      // ------------- 3. Proposed Franchise Details --------------
      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .text("3. Proposed Franchise Details", { underline: true });

      doc.moveDown(1);

      row("Why do you want to start Abacus Learning Program District/Unit Franchise?",
        formData.franchiseReason || "");
      doc.moveDown(1);

      row("Target Area for Students:", formData.targetArea || "");
      row("Expected No. of Students (6 Months):", formData.expectedStudents || "");
      row("Preferred Start Date:", formData.startDate || "");

      doc.moveDown(2);

      // ---------------- 4. Documents ----------------
      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .text("4. Documents to be Attached", { underline: true });

      doc.moveDown(1);

      doc.fontSize(12).font("Helvetica");
      doc.text(". Aadhaar Card Copy");
      doc.text(". PAN Card Copy");
      doc.text(". Passport-size Photograph (2)");
      doc.text(". Address Proof of Centre");
      doc.text(". Any Govt. Registration Proof (Optional)");

      doc.moveDown(2);

      // ----------------- 5. Declaration -----------------
      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .text("5. Declaration", { underline: true });

      doc.moveDown(1);

      doc
        .fontSize(12)
        .font("Helvetica")
        .text(
          "I hereby declare that all information provided above is true to the best of my knowledge. " +
            "I agree to abide by all rules, policies, and operational guidelines of the Abacus Learning Program Powered by Career Ready J&K.",
          { align: "left" }
        );

      doc.moveDown(2);

      doc.text("Signature of Applicant: ____________________    Date: ____________________");

      doc.moveDown(2);

      // ---------------- OFFICE USE ONLY ----------------
      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .text("For Office Use Only", { underline: true });

      doc.moveDown(1);

      const officeField = (label) => {
        doc.font("Helvetica-Bold").text(`${label}: __________________________________________`);
      };

      officeField("Centre Code.");
      officeField("Centre Name.");
      officeField("Date of Receipt");
      officeField("Verified By");
      doc.moveDown(0.5);

      doc.text("Status:  ☐ Rejected    ☐ Pending    ☐ Approved");
      doc.moveDown(0.5);

      officeField("Remarks");

      doc.end();

      stream.on("finish", () => resolve({ filename, filepath }));
      stream.on("error", reject);

    } catch (err) {
      reject(err);
    }
  });
};
