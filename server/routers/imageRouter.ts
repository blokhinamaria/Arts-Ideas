import express from 'express'
import type { Router } from 'express'
import multer from 'multer'
import os from 'os'
import { authMiddleware } from '../controllers/authController.js'
import {
    listFolders,
    listImages,
    uploadImage,
    renameImage,
    moveImage,
    deleteImage,
    uploadPublicImage,
} from '../controllers/imageController.js'

export const imageRouter: Router = express.Router()

// Temp disk storage — files are uploaded to OS temp dir, then sent to Cloudinary
const upload = multer({
    dest: os.tmpdir(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB hard limit
})

// ── Admin routes (auth required) ─────────────────────────────────────────────
imageRouter.get('/folders', authMiddleware, listFolders)
imageRouter.get('/', authMiddleware, listImages)
imageRouter.post('/upload', authMiddleware, upload.single('file'), uploadImage)
imageRouter.put('/rename', authMiddleware, renameImage)
imageRouter.put('/move', authMiddleware, moveImage)
imageRouter.delete('/:publicId', authMiddleware, deleteImage)

// ── Public routes ─────────────────────────────────────────────────────────────
imageRouter.post('/upload-public', upload.single('file'), uploadPublicImage)
