// import multer from "multer"

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, './public/temp')
//     },
//     filename: function (req, file, cb) {
//     //   const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
//       cb(null, file.originalname)
//     }
//   })
  
//   export const upload = multer({ storage})



import multer from "multer";
import path from "path";
import fs from "fs";

// Use /tmp for serverless environments or fall back to local path
const uploadDir = process.env.NODE_ENV === 'production' 
  ? '/tmp' 
  : path.resolve('./public/temp');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      // Add timestamp to prevent filename collisions
      const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniquePrefix + '-' + file.originalname);
    }
});
  
export const upload = multer({ storage });