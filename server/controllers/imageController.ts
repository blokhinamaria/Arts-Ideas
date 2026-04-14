import type { Request, Response } from 'express'
import cloudinary from '../config/cloudinary.js'

// ── GET /api/images/folders ──────────────────────────────────────────────────
// Returns the nested folder tree under the root.

export async function listFolders(_req: Request, res: Response) {
    try {
        // Fetch all sub-folders recursively by getting root folders then their children
        const rootResult = await cloudinary.api.root_folders()
        const rootFolders: { name: string; path: string }[] = rootResult.folders

        const withChildren = await Promise.all(
            rootFolders.map(async (folder) => {
                try {
                    const sub = await cloudinary.api.sub_folders(folder.path)
                    const children: { name: string; path: string }[] = sub.folders
                    // One more level deep
                    const grandchildren = await Promise.all(
                        children.map(async (child) => {
                            try {
                                const gc = await cloudinary.api.sub_folders(child.path)
                                const gcFolders = (gc.folders as { name: string; path: string }[])
                                    .map((f) => ({ ...f, children: [] }))
                                return { ...child, children: gcFolders }
                            } catch {
                                return { ...child, children: [] }
                            }
                        })
                    )
                    return { ...folder, children: grandchildren }
                } catch {
                    return { ...folder, children: [] }
                }
            })
        )

        res.json({ folders: withChildren })
    } catch (err) {
        console.error('Error listing folders:', err)
        res.status(500).json({ message: 'Failed to list folders' })
    }
}

// ── GET /api/images?folder=&cursor= ─────────────────────────────────────────
// Returns paginated images in a folder.

export async function listImages(req: Request, res: Response) {
    try {
        const folder = (req.query.folder as string) ?? ''
        const cursor = (req.query.cursor as string) || undefined

        let resources: any[] = []
        let next_cursor: string | undefined

        if (folder) {
            // Try Fixed Folder Mode first (newer Cloudinary accounts)
            try {
                const result = await (cloudinary.api as any).resources_by_asset_folder(folder, {
                    max_results: 50,
                    next_cursor: cursor,
                })
                resources = result.resources ?? []
                next_cursor = result.next_cursor
                console.log(`[images] resources_by_asset_folder("${folder}") → ${resources.length} results`)
            } catch (e: any) {
                // Fall back to Dynamic Folder Mode (prefix-based)
                console.log(`[images] resources_by_asset_folder failed (${e?.message}), trying prefix`)
                const result = await cloudinary.api.resources({
                    type: 'upload',
                    prefix: folder + '/',
                    max_results: 50,
                    next_cursor: cursor,
                })
                resources = result.resources ?? []
                next_cursor = result.next_cursor
                console.log(`[images] prefix("${folder}/") → ${resources.length} results`)
            }
        } else {
            // No folder selected — list all resources
            const result = await cloudinary.api.resources({
                type: 'upload',
                max_results: 50,
                next_cursor: cursor,
            })
            resources = result.resources ?? []
            next_cursor = result.next_cursor
        }

        const images = resources.map((r) => ({
            public_id: r.public_id,
            secure_url: r.secure_url,
            format: r.format,
            width: r.width,
            height: r.height,
            bytes: r.bytes,
            created_at: r.created_at,
            folder: r.asset_folder ?? r.folder ?? '',
            filename: r.public_id.split('/').pop(),
        }))

        res.json({ images, next_cursor: next_cursor ?? null })
    } catch (err) {
        console.error('Error listing images:', err)
        res.status(500).json({ message: 'Failed to list images' })
    }
}

// ── POST /api/images/upload ──────────────────────────────────────────────────
// Uploads a new image. Expects multipart/form-data with:
//   file     — the image file
//   folder   — target Cloudinary folder path
//   filename — desired filename (without extension)

export async function uploadImage(req: Request, res: Response) {
    try {
        const file = (req as any).file as Express.Multer.File | undefined
        if (!file) { res.status(400).json({ message: 'No file provided' }); return }

        const folder: string = req.body.folder ?? ''
        const filename: string = (req.body.filename as string)?.trim() ?? ''

        if (!filename) { res.status(400).json({ message: 'filename is required' }); return }

        const publicId = folder ? `${folder}/${filename}` : filename

        const result = await cloudinary.uploader.upload(file.path, {
            public_id: publicId,
            use_filename: false,
            overwrite: false,
            resource_type: 'image',
        })

        res.json({
            public_id: result.public_id,
            secure_url: result.secure_url,
            format: result.format,
            width: result.width,
            height: result.height,
        })
    } catch (err: any) {
        console.error('Error uploading image:', err)
        if (err?.http_code === 400 && err?.message?.includes('already exists')) {
            res.status(409).json({ message: 'An image with that name already exists in this folder.' })
            return
        }
        res.status(500).json({ message: 'Failed to upload image' })
    }
}

// ── PUT /api/images/rename ───────────────────────────────────────────────────
// Renames an image within the same folder.
// Body: { from_public_id, new_filename }

export async function renameImage(req: Request, res: Response) {
    try {
        const { from_public_id, new_filename } = req.body as {
            from_public_id?: string
            new_filename?: string
        }
        if (!from_public_id || !new_filename) {
            res.status(400).json({ message: 'from_public_id and new_filename are required' }); return
        }

        // Build new public_id: keep same folder, replace filename
        const parts = from_public_id.split('/')
        parts[parts.length - 1] = new_filename
        const to_public_id = parts.join('/')

        const result = await cloudinary.uploader.rename(from_public_id, to_public_id, { overwrite: false })
        res.json({ public_id: result.public_id, secure_url: result.secure_url })
    } catch (err: any) {
        console.error('Error renaming image:', err)
        res.status(500).json({ message: err?.message ?? 'Failed to rename image' })
    }
}

// ── PUT /api/images/move ─────────────────────────────────────────────────────
// Moves an image to a different folder (rename with new folder prefix).
// Body: { from_public_id, target_folder }

export async function moveImage(req: Request, res: Response) {
    try {
        const { from_public_id, target_folder } = req.body as {
            from_public_id?: string
            target_folder?: string
        }
        if (!from_public_id || target_folder === undefined) {
            res.status(400).json({ message: 'from_public_id and target_folder are required' }); return
        }

        const filename = from_public_id.split('/').pop()!
        const to_public_id = target_folder ? `${target_folder}/${filename}` : filename

        const result = await cloudinary.uploader.rename(from_public_id, to_public_id, { overwrite: false })
        res.json({ public_id: result.public_id, secure_url: result.secure_url })
    } catch (err: any) {
        console.error('Error moving image:', err)
        res.status(500).json({ message: err?.message ?? 'Failed to move image' })
    }
}

// ── DELETE /api/images/:publicId ─────────────────────────────────────────────
// Permanently deletes an image from Cloudinary.
// :publicId is URL-encoded (slashes replaced with %2F)

export async function deleteImage(req: Request, res: Response) {
    try {
        const publicId = decodeURIComponent(req.params.publicId)
        if (!publicId) { res.status(400).json({ message: 'publicId is required' }); return }

        const result = await cloudinary.uploader.destroy(publicId)
        if (result.result !== 'ok') {
            res.status(404).json({ message: 'Image not found or already deleted' }); return
        }
        res.json({ message: 'Deleted', publicId })
    } catch (err) {
        console.error('Error deleting image:', err)
        res.status(500).json({ message: 'Failed to delete image' })
    }
}

// ── POST /api/images/upload-public ──────────────────────────────────────────
// Public (unauthenticated) upload for event submissions.
// Goes to the pending/ folder. Returns public_id.

export async function uploadPublicImage(req: Request, res: Response) {
    try {
        const file = (req as any).file as Express.Multer.File | undefined
        if (!file) { res.status(400).json({ message: 'No file provided' }); return }

        // Validate file type
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp']
        if (!allowedMimes.includes(file.mimetype)) {
            res.status(400).json({ message: 'Only JPEG, PNG, and WebP images are accepted.' }); return
        }

        // Validate file size (max 5 MB)
        if (file.size > 5 * 1024 * 1024) {
            res.status(400).json({ message: 'Image must be 5 MB or smaller.' }); return
        }

        const timestamp = Date.now()
        const publicId = `Arts&Ideas/pending/submission-${timestamp}`

        const result = await cloudinary.uploader.upload(file.path, {
            public_id: publicId,
            use_filename: false,
            overwrite: false,
            resource_type: 'image',
        })

        res.json({ public_id: result.public_id, secure_url: result.secure_url })
    } catch (err) {
        console.error('Error uploading public image:', err)
        res.status(500).json({ message: 'Failed to upload image' })
    }
}
