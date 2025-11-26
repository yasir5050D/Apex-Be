const Franchise = require("../models/Franchise");
const generateFranchisePDF = require("../utils/generateFranchisePDF");
const emailService = require("../services/emailService");
const path = require("path");

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const UPLOADS_DIR = process.env.UPLOADS_DIR || 'uploads';
const NOTIFY_EMAIL = process.env.FROM_EMAIL || null;

exports.register = async (req, res) => {
  try {
    const formData = req.body;
    // check duplicate by email + aadhar or mobile
    const existing = await Franchise.findOne({
      $or: [
        { email: formData.email },
        { aadhar: formData.aadhar },
        { mobile: formData.mobile }
      ].filter(Boolean)
    });

    if (existing) {
      return res.status(409).json({ success: false, error: 'An application already exists with same email/Aadhaar/mobile' });
    }



    // Save to DB
    const franchise = new Franchise(formData);
    await franchise.save();

    // generate pdf
    const pdfResult = await generateFranchisePDF(formData, franchise._id);
    const pdfUrl = `${BASE_URL}/uploads/${pdfResult.filename}`;
    const pdfPath = path.join(process.cwd(), pdfResult.filepath);

    // send emails (notify team and applicant) - don't fail the request if email fails
    try {
      const subject = `Franchise Application Received - ${franchise.fullName || franchise._id}`;
      const text = `A new franchise application has been submitted.\nApplicant: ${franchise.fullName}\nDistrict Applying For: ${franchise.districtApplyingFor}\n\nPDF attached.`;

      // send to notify email if configured
      if (NOTIFY_EMAIL) {
        await emailService.sendFranchiseEmail(NOTIFY_EMAIL, subject, text, pdfPath);
      }

      // send to applicant email as well (optional)
      if (franchise.email) {
        await emailService.sendFranchiseEmail(franchise.email, 'Your Franchise Application (Career Ready JK)', 'Thank you for applying. Please find attached the application PDF.', pdfPath);
      }
    } catch (emailErr) {
      console.error('Email send failed', emailErr);
    }

    res.status(201).json({
      success: true,
      message: 'Franchise registration saved and PDF generated',
      pdfUrl
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
},

  exports.getPdf = async (req, res) => {
    const id = req.params.id;
    const filename = `franchise_${id}.pdf`;
    const filepath = path.join(process.cwd(), process.env.UPLOADS_DIR || 'uploads', filename);
    res.download(filepath, filename, err => {
      if (err) res.status(404).json({ success: false, error: 'PDF not found' });
    });
  };


