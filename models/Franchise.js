const mongoose = require("mongoose");

const franchiseSchema = new mongoose.Schema({
  franchiseType: {
    type: String,
    enum: ["District Franchise", "Unit Franchise"],
    required: true
  },
  fullName: {
    type: String,
    required: [true, "Full Name is required"],
    minlength: 3,
    maxlength: 100,
    trim: true
  },

  fatherName: {
    type: String,
    required: [true, "Father Name is required"],
    minlength: 3,
    maxlength: 100,
    trim: true
  },

  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (v) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/.test(v),
      message: "Invalid email format"
    }
  },

  aadhar: {
    type: String,
    required: true,
    validate: {
      validator: (v) => /^\d{12}$/.test(v),
      message: "Aadhar must be 12 digits"
    }
  },

  pan: {
    type: String,
    required: true,
    uppercase: true,
    validate: {
      validator: (v) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v),
      message: "Invalid PAN format"
    }
  },

  mobile: {
    type: String,
    required: true,
    validate: {
      validator: (v) => /^(\+91[\-\s]?)?[6-9]\d{9}$/.test(v),
      message: "Invalid Indian mobile number"
    }
  },

  address: { type: String, required: true, maxlength: 300 },
  district: { type: String, required: true },
  tehsil: { type: String, required: true },
  pincode: { 
    type: String,
    required: true,
    validate: { validator: (v) => /^\d{6}$/.test(v), message: "Invalid PIN Code" }
  },

  districtApplyingFor: { type: String, required: true },

  registrationDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Franchise", franchiseSchema);
