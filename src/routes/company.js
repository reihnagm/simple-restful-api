const express = require('express')
const Route = express.Router()
const company = require('../controllers/company')
const multer = require('multer')
const storage = multer.diskStorage({
  destination: (request, file, callback) => {
    callback(null, './public/images/company')
  },
  filename: (request, file, callback) => {
    callback(null, file.originalname)
  }
})

const upload = multer({
  storage
})

Route
  .get("/", company.all)
  .get("/profile/:slug", company.getProfileBySlug)
  .post("/", upload.single("logo"), company.store)
  .put("/", upload.single("logo"), company.update)
  .post("/add-jobs", company.addJobs)
  .post("/profile", company.getProfile)
  .delete("/:uid", company.delete)

module.exports = Route
