const express = require("express");
const router = express.Router();

const franchiseController = require("../controllers/franchiseController");
const {validateFranchiseRegistration} = require('../middleware/validation');
router.post("/register", validateFranchiseRegistration, franchiseController.register);
router.get('/pdf/:id', franchiseController.getPdf);
module.exports = router;
