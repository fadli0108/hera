const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const dayjs = require("dayjs"); // Import dayjs untuk mengelola tanggal

const app = express();
const PORT = 3000;

// Konfigurasi folder public untuk CSS, gambar, dan dokumen
app.use(express.static("public"));
app.use(express.static("uploads"));
app.use(express.static("documents")); // Tambahkan folder untuk dokumen
app.use(express.static(path.join(__dirname, "/node_modules")));

// Konfigurasi EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Folder untuk menyimpan gambar dan dokumen yang diupload
const uploadFolder = "uploads/";
const documentFolder = "documents/";

// Konfigurasi Multer untuk upload gambar
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const uploadImage = multer({ storage: imageStorage });

// Konfigurasi Multer untuk upload dokumen
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, documentFolder);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const uploadDocument = multer({ storage: documentStorage });

// Baca data JSON
const imageJsonFilePath = "./data/images.json";
const documentJsonFilePath = "./data/documents.json";

function getImages() {
  if (fs.existsSync(imageJsonFilePath)) {
    const data = fs.readFileSync(imageJsonFilePath);
    return JSON.parse(data);
  }
  return [];
}

function getDocuments() {
  if (fs.existsSync(documentJsonFilePath)) {
    const data = fs.readFileSync(documentJsonFilePath);
    return JSON.parse(data);
  }
  return [];
}

// Simpan data ke file JSON
function saveImages(images) {
  fs.writeFileSync(imageJsonFilePath, JSON.stringify(images, null, 2));
}

function saveDocuments(documents) {
  fs.writeFileSync(documentJsonFilePath, JSON.stringify(documents, null, 2));
}

// Route untuk halaman utama
app.get("/", (req, res) => {
  let images = getImages();

  // Urutkan gambar berdasarkan id dari yang terbaru ke yang terlama
    images.sort((a, b) => b.id - a.id);
    const latestImages = images.slice(0, 5);
    const documents = getDocuments();
    documents.sort((a, b) => b.id - a.id);
    const latestDocument = documents.slice(0, 5);

  // Ambil 5 gambar terbaru
  
  const data = {
    content: 'home.ejs'
  };

  res.render('index', { images: latestImages, documents :latestDocument, data });
});

app.get("/gambar", (req, res) => {
  const images = getImages();
  images.sort((a, b) => b.id - a.id);
  const data = {
    content: 'gambar.ejs'
  };

  res.render("index", { images, data });
});
app.get("/document", (req, res) => {
  const documents = getDocuments();
  documents.sort((a, b) => b.id - a.id);
  const data = {
    content: 'document.ejs'
  };

  res.render("index", { documents, data });
});

// Route untuk upload gambar
app.post("/upload", uploadImage.single("image"), (req, res) => {
  const images = getImages();
  const newImage = {
    id: Date.now(),
    filename: req.file.filename,
    description: req.body.description,
    uploadDate: dayjs().format("YYYY-MM-DD HH:mm:ss") // Tambahkan tanggal upload
  };
  images.push(newImage);
  saveImages(images);
  res.redirect("/gambar");
});

// Route untuk upload dokumen PDF
app.post("/upload-pdf", uploadDocument.single("document"), (req, res) => {
  const documents = getDocuments();
  const newDocument = {
    id: Date.now(),
      filename: req.file.filename,
    description: req.body.description,
    uploadDate: dayjs().format("YYYY-MM-DD HH:mm:ss") // Tambahkan tanggal upload
  };
  documents.push(newDocument);
  saveDocuments(documents);
  res.redirect("/");
});

// Route untuk delete gambar
app.post("/delete/:id", (req, res) => {
  const id = parseInt(req.params.id);
  let images = getImages();
  const image = images.find((img) => img.id === id);

  if (image) {
    fs.unlinkSync(path.join(uploadFolder, image.filename));
    images = images.filter((img) => img.id !== id);
    saveImages(images);
  }

  res.redirect("/");
});

app.post("/delete-document/:id", (req, res) => {
  const id = parseInt(req.params.id);
  let documents = getDocuments();
  const document = documents.find((doc) => doc.id === id);

  if (document) {
    fs.unlinkSync(path.join(documentFolder, document.filename));
    documents = documents.filter((doc) => doc.id !== id);
    saveDocuments(documents);
  }

  res.redirect("/document");
});
// Jalankan server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
