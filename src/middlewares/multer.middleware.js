import multer from "multer";
import path from "path"

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`)
    }
})

const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|mp4|mov|mkv|pdf|doc|docx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = filetypes.test(file.mimetype)

    if(extname && mimetype){
        return cb(null, true);
    } else {
        cb(new Error('Unsupported file type'), false);
    }
}

export const upload = multer({
    storage,
    fileFilter,
    limits: { 
        fileSize: 1024 * 1024 * 50 
    }
})