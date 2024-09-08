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
    const allowedExtensions = [
        '.jpeg', '.jpg', '.png', '.gif', '.bmp', '.tiff', '.svg', 
        '.mp4', '.mov', '.mkv', '.avi', '.webm', '.3gp',
        '.pdf', '.doc', '.docx', '.epub', '.tar', '.zip', '.rar',
        '.mp3', '.wav', '.ogg', '.aac',
        '.txt', '.html', '.json', '.xml',
        '.gz', '.bz2',
        '.7z', '.iso'
    ]

    const allowedMimeTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'image/svg+xml',
        'video/mp4', 'video/quicktime', 'video/x-matroska', 'video/avi', 'video/webm', 'video/3gpp',
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/epub+zip', 'application/x-tar', 'application/zip', 'application/x-rar-compressed',
        'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac',
        'text/plain', 'text/html', 'application/json', 'application/xml',
        'application/gzip', 'application/x-bzip2',
        'application/x-7z-compressed', 'application/x-iso9660-image'
    ]

    const extname = path.extname(file.originalname).toLowerCase()
    const mimetype = file.mimetype;

    const isExtensionValid = allowedExtensions.includes(extname)
    const isMimetypeValid = allowedMimeTypes.includes(mimetype)

    if (isExtensionValid && isMimetypeValid) {
        return cb(null, true)
    } else {
        return cb(new Error('Unsupported file type'), false)
    }

}

export const upload = multer({
    storage,
    fileFilter,
    limits: { 
        fileSize: 1024 * 1024 * 50 
    }
})