import { useState, useEffect, useRef, useCallback } from 'react';
import { Cloudinary } from '@cloudinary/url-gen';
import { scale } from '@cloudinary/url-gen/actions/resize';
import { AdvancedImage } from '@cloudinary/react';
import './ImagesTab.css';

const API_BASE = import.meta.env.DEV ? 'http://localhost:3000' : '';
const cloudinary = new Cloudinary({ cloud: { cloudName: 'ded4glttn' } });

// ── Types ────────────────────────────────────────────────────────────────────

type FolderNode = {
    name: string;
    path: string;
    children: FolderNode[];
};

type CloudinaryImage = {
    public_id: string;
    secure_url: string;
    format: string;
    width: number;
    height: number;
    bytes: number;
    created_at: string;
    folder: string;
    filename: string;
};

// ── Folder tree ──────────────────────────────────────────────────────────────

function FolderTree({
    folders,
    selectedFolder,
    onSelect,
    depth = 0,
}: {
    folders: FolderNode[];
    selectedFolder: string;
    onSelect: (path: string) => void;
    depth?: number;
}) {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    function toggle(path: string) {
        setExpanded((prev) => {
            const next = new Set(prev);
            next.has(path) ? next.delete(path) : next.add(path);
            return next;
        });
    }

    return (
        <ul className="img-folder-list" style={{ paddingLeft: depth > 0 ? 14 : 0 }}>
            {folders.map((folder) => (
                <li key={folder.path} className="img-folder-item">
                    <div
                        className={`img-folder-row${selectedFolder === folder.path ? ' is-active' : ''}`}
                        onClick={() => { onSelect(folder.path); if (folder.children?.length) toggle(folder.path); }}
                    >
                        {(folder.children?.length ?? 0) > 0 && (
                            <span className="img-folder-arrow">{expanded.has(folder.path) ? '▾' : '▸'}</span>
                        )}
                        {(folder.children?.length ?? 0) === 0 && <span className="img-folder-arrow img-folder-arrow--spacer" />}
                        <span className="img-folder-name">{folder.name}</span>
                    </div>
                    {(folder.children?.length ?? 0) > 0 && expanded.has(folder.path) && (
                        <FolderTree
                            folders={folder.children}
                            selectedFolder={selectedFolder}
                            onSelect={onSelect}
                            depth={depth + 1}
                        />
                    )}
                </li>
            ))}
        </ul>
    );
}

// ── Upload dialog ────────────────────────────────────────────────────────────

function UploadDialog({
    folders,
    defaultFolder,
    onUpload,
    onClose,
}: {
    folders: FolderNode[];
    defaultFolder: string;
    onUpload: () => void;
    onClose: () => void;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [filename, setFilename] = useState('');
    const [folder, setFolder] = useState(defaultFolder);
    const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    // Flatten folder tree for the select
    function flattenFolders(nodes: FolderNode[], result: { label: string; path: string }[] = [], depth = 0) {
        for (const node of nodes) {
            result.push({ label: '\u00a0'.repeat(depth * 3) + node.name, path: node.path });
            if (node.children?.length) flattenFolders(node.children, result, depth + 1);
        }
        return result;
    }
    const flatFolders = flattenFolders(folders);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!file) { setErrorMsg('Select a file.'); return; }
        if (!filename.trim()) { setErrorMsg('Enter a filename.'); return; }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);
        formData.append('filename', filename.trim());

        setStatus('loading');
        setErrorMsg('');
        try {
            const res = await fetch(`${API_BASE}/api/images/upload`, {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) { setErrorMsg(data.message ?? 'Upload failed.'); setStatus('error'); return; }
            onUpload();
            onClose();
        } catch {
            setErrorMsg('Upload failed. Check your connection.');
            setStatus('error');
        }
    }

    return (
        <div className="img-dialog-backdrop">
            <div className="img-dialog">
                <header className="img-dialog-header">
                    <h3 className="img-dialog-title">Upload Image</h3>
                    <button className="img-dialog-close" onClick={onClose}>&#x2715;</button>
                </header>
                <form className="img-dialog-form" onSubmit={handleSubmit}>
                    <div className="img-dialog-field">
                        <label className="img-dialog-label">File</label>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => {
                                const f = e.target.files?.[0] ?? null;
                                setFile(f);
                                if (f && !filename) {
                                    // Pre-fill filename from file, strip extension
                                    setFilename(f.name.replace(/\.[^.]+$/, ''));
                                }
                            }}
                        />
                    </div>
                    <div className="img-dialog-field">
                        <label className="img-dialog-label">Filename (no extension)</label>
                        <input
                            type="text"
                            value={filename}
                            onChange={(e) => setFilename(e.target.value)}
                            placeholder="e.g. battell-chapel-exterior"
                        />
                    </div>
                    <div className="img-dialog-field">
                        <label className="img-dialog-label">Folder</label>
                        <select value={folder} onChange={(e) => setFolder(e.target.value)}>
                            <option value="">— Root —</option>
                            {flatFolders.map((f) => (
                                <option key={f.path} value={f.path}>{f.label}</option>
                            ))}
                        </select>
                    </div>
                    {errorMsg && <p className="img-dialog-error">{errorMsg}</p>}
                    <div className="img-dialog-actions">
                        <button type="button" className="img-btn img-btn--ghost" onClick={onClose}>Cancel</button>
                        <button type="submit" className="img-btn img-btn--primary" disabled={status === 'loading'}>
                            {status === 'loading' ? 'Uploading…' : 'Upload'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function ImagesTab() {
    const [folders, setFolders] = useState<FolderNode[]>([]);
    const [selectedFolder, setSelectedFolder] = useState('');
    const [images, setImages] = useState<CloudinaryImage[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<CloudinaryImage | null>(null);
    const [foldersLoading, setFoldersLoading] = useState(true);
    const [imagesLoading, setImagesLoading] = useState(false);
    const [error, setError] = useState('');

    // Inline action state
    const [renameValue, setRenameValue] = useState('');
    const [renameActive, setRenameActive] = useState(false);
    const [moveFolder, setMoveFolder] = useState('');
    const [moveActive, setMoveActive] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [actionStatus, setActionStatus] = useState<'idle' | 'loading' | 'error'>('idle');
    const [actionError, setActionError] = useState('');
    const [showUploadDialog, setShowUploadDialog] = useState(false);

    const renameInputRef = useRef<HTMLInputElement>(null);

    // Flatten folder tree for move select
    function flattenFolders(nodes: FolderNode[], result: { label: string; path: string }[] = [], depth = 0) {
        for (const node of nodes) {
            result.push({ label: '\u00a0'.repeat(depth * 3) + node.name, path: node.path });
            if (node.children?.length) flattenFolders(node.children, result, depth + 1);
        }
        return result;
    }

    const fetchFolders = useCallback(async () => {
        setFoldersLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/images/folders`, { credentials: 'include' });
            if (!res.ok) { setError('Failed to load folders.'); return; }
            const data = await res.json();
            setFolders(data.folders);
        } catch {
            setError('Failed to load folders.');
        } finally {
            setFoldersLoading(false);
        }
    }, []);

    const fetchImages = useCallback(async (folder: string, cursor?: string) => {
        setImagesLoading(true);
        setError('');
        try {
            const params = new URLSearchParams({ folder });
            if (cursor) params.set('cursor', cursor);
            const res = await fetch(`${API_BASE}/api/images?${params}`, { credentials: 'include' });
            if (!res.ok) { setError('Failed to load images.'); return; }
            const data = await res.json();
            if (cursor) {
                setImages((prev) => [...prev, ...data.images]);
            } else {
                setImages(data.images);
            }
            setNextCursor(data.next_cursor);
        } catch {
            setError('Failed to load images.');
        } finally {
            setImagesLoading(false);
        }
    }, []);

    useEffect(() => { fetchFolders(); }, [fetchFolders]);

    function selectFolder(path: string) {
        setSelectedFolder(path);
        setSelectedImage(null);
        setImages([]);
        setNextCursor(null);
        fetchImages(path);
        resetActions();
    }

    function resetActions() {
        setRenameActive(false);
        setRenameValue('');
        setMoveActive(false);
        setMoveFolder('');
        setDeleteConfirm(false);
        setActionStatus('idle');
        setActionError('');
    }

    function selectImage(img: CloudinaryImage) {
        if (selectedImage?.public_id === img.public_id) {
            setSelectedImage(null);
            resetActions();
        } else {
            setSelectedImage(img);
            resetActions();
        }
    }

    async function handleRename() {
        if (!selectedImage || !renameValue.trim()) return;
        setActionStatus('loading');
        setActionError('');
        try {
            const res = await fetch(`${API_BASE}/api/images/rename`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ from_public_id: selectedImage.public_id, new_filename: renameValue.trim() }),
            });
            const data = await res.json();
            if (!res.ok) { setActionError(data.message ?? 'Rename failed.'); setActionStatus('error'); return; }
            setActionStatus('idle');
            setSelectedImage(null);
            setRenameActive(false);
            setRenameValue('');
            fetchImages(selectedFolder);
        } catch {
            setActionError('Rename failed.');
            setActionStatus('error');
        }
    }

    async function handleMove() {
        if (!selectedImage) return;
        setActionStatus('loading');
        setActionError('');
        try {
            const res = await fetch(`${API_BASE}/api/images/move`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ from_public_id: selectedImage.public_id, target_folder: moveFolder }),
            });
            const data = await res.json();
            if (!res.ok) { setActionError(data.message ?? 'Move failed.'); setActionStatus('error'); return; }
            setActionStatus('idle');
            setSelectedImage(null);
            setMoveActive(false);
            fetchImages(selectedFolder);
        } catch {
            setActionError('Move failed.');
            setActionStatus('error');
        }
    }

    async function handleDelete() {
        if (!selectedImage) return;
        setActionStatus('loading');
        setActionError('');
        try {
            const encoded = encodeURIComponent(selectedImage.public_id);
            const res = await fetch(`${API_BASE}/api/images/${encoded}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok) { setActionError(data.message ?? 'Delete failed.'); setActionStatus('error'); return; }
            setImages((prev) => prev.filter((i) => i.public_id !== selectedImage.public_id));
            setSelectedImage(null);
            setDeleteConfirm(false);
            setActionStatus('idle');
        } catch {
            setActionError('Delete failed.');
            setActionStatus('error');
        }
    }

    const flatFolders = flattenFolders(folders);
    const hasSelected = !!selectedImage;

    return (
        <div className="images-tab">
            {/* ── Toolbar ── */}
            <div className="img-toolbar">
                <button
                    className="img-btn img-btn--primary"
                    onClick={() => setShowUploadDialog(true)}
                >
                    Upload Image
                </button>

                <div className="img-toolbar-actions">
                    {hasSelected && !renameActive && !moveActive && !deleteConfirm && (
                        <>
                            <button
                                className="img-btn img-btn--ghost"
                                onClick={() => { setRenameActive(true); setRenameValue(selectedImage!.filename); setTimeout(() => renameInputRef.current?.focus(), 50); }}
                            >
                                Rename
                            </button>
                            <button
                                className="img-btn img-btn--ghost"
                                onClick={() => { setMoveActive(true); setMoveFolder(selectedImage!.folder); }}
                            >
                                Move
                            </button>
                            <button
                                className="img-btn img-btn--danger"
                                onClick={() => setDeleteConfirm(true)}
                            >
                                Delete
                            </button>
                        </>
                    )}

                    {/* Rename inline */}
                    {renameActive && (
                        <div className="img-inline-action">
                            <span className="img-inline-label">New name:</span>
                            <input
                                ref={renameInputRef}
                                className="img-inline-input"
                                type="text"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') { setRenameActive(false); setRenameValue(''); } }}
                                placeholder="new-filename"
                            />
                            <button className="img-btn img-btn--primary" onClick={handleRename} disabled={actionStatus === 'loading'}>
                                {actionStatus === 'loading' ? 'Saving…' : 'Confirm'}
                            </button>
                            <button className="img-btn img-btn--ghost" onClick={() => { setRenameActive(false); setRenameValue(''); }}>Cancel</button>
                        </div>
                    )}

                    {/* Move inline */}
                    {moveActive && (
                        <div className="img-inline-action">
                            <span className="img-inline-label">Move to:</span>
                            <select className="img-inline-select" value={moveFolder} onChange={(e) => setMoveFolder(e.target.value)}>
                                <option value="">— Root —</option>
                                {flatFolders.map((f) => (
                                    <option key={f.path} value={f.path}>{f.label}</option>
                                ))}
                            </select>
                            <button className="img-btn img-btn--primary" onClick={handleMove} disabled={actionStatus === 'loading'}>
                                {actionStatus === 'loading' ? 'Moving…' : 'Confirm'}
                            </button>
                            <button className="img-btn img-btn--ghost" onClick={() => { setMoveActive(false); setMoveFolder(''); }}>Cancel</button>
                        </div>
                    )}

                    {/* Delete inline confirm */}
                    {deleteConfirm && (
                        <div className="img-inline-action">
                            <span className="img-inline-label">Delete "{selectedImage?.filename}"?</span>
                            <button className="img-btn img-btn--danger-solid" onClick={handleDelete} disabled={actionStatus === 'loading'}>
                                {actionStatus === 'loading' ? 'Deleting…' : 'Confirm Delete'}
                            </button>
                            <button className="img-btn img-btn--ghost" onClick={() => setDeleteConfirm(false)}>Cancel</button>
                        </div>
                    )}

                    {actionError && <span className="img-action-error">{actionError}</span>}
                </div>
            </div>

            {/* ── Main layout ── */}
            <div className="img-layout">
                {/* Folder tree */}
                <aside className="img-sidebar">
                    <p className="img-sidebar-label">Folders</p>
                    {foldersLoading ? (
                        <p className="img-status">Loading…</p>
                    ) : (
                        <>
                            <div
                                className={`img-folder-row${selectedFolder === '' ? ' is-active' : ''}`}
                                onClick={() => selectFolder('')}
                                style={{ paddingLeft: 0 }}
                            >
                                <span className="img-folder-arrow img-folder-arrow--spacer" />
                                <span className="img-folder-name">All images</span>
                            </div>
                            <FolderTree
                                folders={folders}
                                selectedFolder={selectedFolder}
                                onSelect={selectFolder}
                            />
                        </>
                    )}
                </aside>

                {/* Image grid */}
                <main className="img-grid-area">
                    {error && <p className="img-status img-status--error">{error}</p>}
                    {!error && images.length === 0 && !imagesLoading && selectedFolder !== undefined && (
                        <p className="img-status">
                            {selectedFolder === '' ? 'Select a folder to browse images.' : 'No images in this folder.'}
                        </p>
                    )}

                    <div className="img-grid">
                        {images.map((img) => {
                            const cldImg = cloudinary
                                .image(img.public_id)
                                .format('auto')
                                .quality('auto')
                                .resize(scale().width(200));
                            return (
                                <button
                                    key={img.public_id}
                                    className={`img-card${selectedImage?.public_id === img.public_id ? ' is-selected' : ''}`}
                                    onClick={() => selectImage(img)}
                                    title={img.public_id}
                                >
                                    <div className="img-card-thumb">
                                        <AdvancedImage cldImg={cldImg} alt={img.filename} />
                                    </div>
                                    <p className="img-card-name">{img.filename}</p>
                                </button>
                            );
                        })}
                    </div>

                    {imagesLoading && <p className="img-status">Loading images…</p>}

                    {nextCursor && !imagesLoading && (
                        <button
                            className="img-btn img-btn--ghost img-load-more"
                            onClick={() => fetchImages(selectedFolder, nextCursor)}
                        >
                            Load more
                        </button>
                    )}
                </main>
            </div>

            {/* ── Selected image detail ── */}
            {selectedImage && !renameActive && !moveActive && !deleteConfirm && (
                <div className="img-detail-bar">
                    <span className="img-detail-id">{selectedImage.public_id}</span>
                    <span className="img-detail-meta">
                        {selectedImage.format.toUpperCase()} · {selectedImage.width}×{selectedImage.height} · {(selectedImage.bytes / 1024).toFixed(0)} KB
                    </span>
                </div>
            )}

            {/* ── Upload dialog ── */}
            {showUploadDialog && (
                <UploadDialog
                    folders={folders}
                    defaultFolder={selectedFolder}
                    onUpload={() => fetchImages(selectedFolder)}
                    onClose={() => setShowUploadDialog(false)}
                />
            )}
        </div>
    );
}
