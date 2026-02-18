import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { filesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Folder,
  FolderPlus,
  File,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Download,
  Trash2,
  Share2,
  MoreVertical,
  ChevronRight,
  Upload,
  X,
} from 'lucide-react';

const FilesPage = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderPath, setFolderPath] = useState([]);
  const [newFolderDialog, setNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchFiles();
    fetchFolders();
  }, [currentFolder]);

  const fetchFiles = async () => {
    try {
      const params = currentFolder ? { folder_id: currentFolder } : {};
      const response = await filesAPI.getAll(params);
      setFiles(response.data);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const params = { parent_id: currentFolder || null };
      const response = await filesAPI.getFolders(params);
      setFolders(response.data);
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) { toast.error('Folder name is required'); return; }
    try {
      await filesAPI.createFolder({ name: newFolderName, parent_id: currentFolder });
      toast.success('Folder created');
      setNewFolderDialog(false);
      setNewFolderName('');
      fetchFolders();
    } catch (error) {
      toast.error('Failed to create folder');
    }
  };

  const getFileType = (mimeType) => {
    if (!mimeType) return 'other';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('word') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive';
    return 'other';
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) { toast.error('Please select a file'); return; }
    if (selectedFile.size > 10 * 1024 * 1024) { toast.error('File must be under 10MB'); return; }
    setUploading(true);
    setUploadProgress(10);
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        setUploadProgress(50);
        const payload = {
          name: selectedFile.name,
          original_name: selectedFile.name,
          file_type: getFileType(selectedFile.type),
          mime_type: selectedFile.type || 'application/octet-stream',
          size: selectedFile.size,
          url: evt.target.result, // store base64 as url for now
          folder_id: currentFolder || null,
        };
        setUploadProgress(80);
        await filesAPI.create(payload);
        setUploadProgress(100);
        toast.success(`${selectedFile.name} uploaded successfully`);
        setUploadDialog(false);
        setSelectedFile(null);
        setUploadProgress(0);
        fetchFiles();
      };
      reader.readAsDataURL(selectedFile);
    } catch {
      toast.error('Upload failed');
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      await filesAPI.delete(fileId);
      toast.success('File deleted');
      fetchFiles();
    } catch (error) {
      toast.error('Failed to delete file');
    }
  };

  const navigateToFolder = (folder) => {
    setFolderPath([...folderPath, { id: currentFolder, name: folderPath.length === 0 ? 'Documents' : folderPath[folderPath.length - 1]?.name }]);
    setCurrentFolder(folder.id);
  };

  const navigateBack = (index) => {
    if (index === -1) {
      setCurrentFolder(null);
      setFolderPath([]);
    } else {
      const newPath = folderPath.slice(0, index + 1);
      setCurrentFolder(newPath[newPath.length - 1]?.id || null);
      setFolderPath(newPath.slice(0, -1));
    }
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'document': return <FileText className="w-8 h-8 text-blue-500" />;
      case 'image': return <Image className="w-8 h-8 text-emerald-500" />;
      case 'video': return <Video className="w-8 h-8 text-purple-500" />;
      case 'audio': return <Music className="w-8 h-8 text-amber-500" />;
      case 'archive': return <Archive className="w-8 h-8 text-slate-500" />;
      default: return <File className="w-8 h-8 text-slate-400" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="files-page">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">MICTSETA Documents</h2>
          <p className="text-slate-600 mt-1">Upload, store, and manage internship and learnership documents in line with MICTSETA requirements</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={newFolderDialog} onOpenChange={setNewFolderDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2" data-testid="create-folder-btn">
                <FolderPlus className="w-4 h-4" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Folder Name</Label>
                  <Input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name"
                    data-testid="input-folder-name"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewFolderDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateFolder}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button className="gap-2" onClick={() => setUploadDialog(true)} data-testid="upload-file-btn">
            <Upload className="w-4 h-4" />
            Upload File
          </Button>
        </div>
      </div>

      {/* Upload File Dialog */}
      <Dialog open={uploadDialog} onOpenChange={(open) => { setUploadDialog(open); if (!open) { setSelectedFile(null); setUploadProgress(0); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-slate-300 hover:border-primary'}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-8 h-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium text-slate-900">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700">Drop file here or click to browse</p>
                  <p className="text-xs text-slate-400 mt-1">Max 10MB. Any file type.</p>
                </div>
              )}
            </div>
            {uploading && uploadProgress > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Uploading...</span><span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialog(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={!selectedFile || uploading} className="gap-2">
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Breadcrumb */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <button
              className="text-sm font-medium text-primary hover:underline"
              onClick={() => navigateBack(-1)}
            >
              Documents
            </button>
            {folderPath.map((folder, index) => (
              <React.Fragment key={index}>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <button
                  className="text-sm font-medium text-primary hover:underline"
                  onClick={() => navigateBack(index)}
                >
                  {folder.name}
                </button>
              </React.Fragment>
            ))}
            {currentFolder && (
              <>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-900">
                  {folders.find(f => f.id === currentFolder)?.name || 'Current'}
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search files and folders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white"
          data-testid="search-files-input"
        />
      </div>

      {/* Folders */}
      {filteredFolders.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Folders</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredFolders.map((folder) => (
              <Card
                key={folder.id}
                className="bg-white border-slate-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => navigateToFolder(folder)}
                data-testid={`folder-${folder.id}`}
              >
                <CardContent className="p-4 text-center">
                  <Folder
                    className="w-12 h-12 mx-auto mb-2"
                    style={{ color: folder.color || '#0056B3' }}
                    fill={folder.color || '#0056B3'}
                    fillOpacity={0.2}
                  />
                  <p className="font-medium text-sm text-slate-900 truncate">{folder.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Files */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Files</h3>
        {filteredFiles.length === 0 && filteredFolders.length === 0 ? (
          <Card className="bg-white border-slate-200">
            <CardContent className="p-12 text-center">
              <File className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-heading font-semibold text-slate-900 mb-2">No files yet</h3>
              <p className="text-slate-600">Upload files or create folders to organize your documents</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredFiles.map((file) => (
              <Card
                key={file.id}
                className="bg-white border-slate-200 hover:shadow-md transition-all duration-200"
                data-testid={`file-${file.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    {getFileIcon(file.file_type)}
                    <div className="flex gap-1">
                      {file.is_shared && (
                        <Badge variant="secondary" className="text-xs">
                          <Share2 className="w-3 h-3" />
                        </Badge>
                      )}
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <h4 className="font-medium text-sm text-slate-900 truncate mb-1">{file.name}</h4>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{formatFileSize(file.size)}</span>
                    <span>{formatDate(file.created_at)}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        if (file.url?.startsWith('data:')) {
                          const a = document.createElement('a');
                          a.href = file.url;
                          a.download = file.original_name || file.name;
                          a.click();
                        } else {
                          window.open(file.url, '_blank');
                        }
                      }}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-600"
                      onClick={() => handleDeleteFile(file.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilesPage;
