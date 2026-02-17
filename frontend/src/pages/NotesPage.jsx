import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { notesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  StickyNote,
  Folder,
  Share2,
  Pin,
  Edit,
  Trash2,
  Tag,
  MoreVertical,
  FolderPlus,
  Users,
  Clock,
} from 'lucide-react';

const NotesPage = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [sharedNotes, setSharedNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [newNoteDialog, setNewNoteDialog] = useState(false);
  const [newFolderDialog, setNewFolderDialog] = useState(false);
  const [editNoteDialog, setEditNoteDialog] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    folder_id: null,
    tags: [],
    color: null,
    is_pinned: false,
  });
  const [newFolder, setNewFolder] = useState({ name: '', color: '#0056B3' });
  const [tagInput, setTagInput] = useState('');

  const colors = [
    { name: 'Default', value: null },
    { name: 'Yellow', value: '#FEF3C7' },
    { name: 'Green', value: '#D1FAE5' },
    { name: 'Blue', value: '#DBEAFE' },
    { name: 'Purple', value: '#EDE9FE' },
    { name: 'Pink', value: '#FCE7F3' },
  ];

  useEffect(() => {
    fetchNotes();
    fetchSharedNotes();
    fetchFolders();
  }, [selectedFolder]);

  const fetchNotes = async () => {
    try {
      const params = selectedFolder ? { folder_id: selectedFolder } : {};
      const response = await notesAPI.getAll(params);
      setNotes(response.data);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSharedNotes = async () => {
    try {
      const response = await notesAPI.getShared();
      setSharedNotes(response.data);
    } catch (error) {
      console.error('Failed to fetch shared notes:', error);
    }
  };

  const fetchFolders = async () => {
    try {
      const response = await notesAPI.getFolders();
      setFolders(response.data);
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    }
  };

  const handleCreateNote = async () => {
    try {
      await notesAPI.create(newNote);
      toast.success('Note created successfully');
      setNewNoteDialog(false);
      setNewNote({ title: '', content: '', folder_id: null, tags: [], color: null, is_pinned: false });
      fetchNotes();
    } catch (error) {
      toast.error('Failed to create note');
    }
  };

  const handleUpdateNote = async () => {
    if (!selectedNote) return;
    try {
      await notesAPI.update(selectedNote.id, selectedNote);
      toast.success('Note updated');
      setEditNoteDialog(false);
      setSelectedNote(null);
      fetchNotes();
    } catch (error) {
      toast.error('Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await notesAPI.delete(noteId);
      toast.success('Note deleted');
      fetchNotes();
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const handleCreateFolder = async () => {
    try {
      await notesAPI.createFolder(newFolder);
      toast.success('Folder created');
      setNewFolderDialog(false);
      setNewFolder({ name: '', color: '#0056B3' });
      fetchFolders();
    } catch (error) {
      toast.error('Failed to create folder');
    }
  };

  const handleTogglePin = async (note) => {
    try {
      await notesAPI.update(note.id, { is_pinned: !note.is_pinned });
      fetchNotes();
    } catch (error) {
      toast.error('Failed to update note');
    }
  };

  const addTag = (noteObj, setNoteObj) => {
    if (tagInput.trim() && !noteObj.tags.includes(tagInput.trim())) {
      setNoteObj({ ...noteObj, tags: [...noteObj.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag, noteObj, setNoteObj) => {
    setNoteObj({ ...noteObj, tags: noteObj.tags.filter(t => t !== tag) });
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const pinnedNotes = filteredNotes.filter(n => n.is_pinned);
  const regularNotes = filteredNotes.filter(n => !n.is_pinned);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const NoteCard = ({ note, isShared = false }) => (
    <Card
      className="bg-white border-slate-200 hover:shadow-md transition-all duration-200 cursor-pointer"
      style={{ backgroundColor: note.color || 'white' }}
      data-testid={`note-card-${note.id}`}
      onClick={() => { setSelectedNote(note); setEditNoteDialog(true); }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-slate-900 line-clamp-1">{note.title}</h4>
          <div className="flex items-center gap-1">
            {note.is_pinned && <Pin className="w-4 h-4 text-amber-500" />}
            {note.is_shared && <Share2 className="w-4 h-4 text-blue-500" />}
          </div>
        </div>
        <p className="text-sm text-slate-600 line-clamp-3 mb-3">{note.content}</p>
        {note.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {note.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
            {note.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">+{note.tags.length - 3}</Badge>
            )}
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(note.updated_at || note.created_at)}
          </div>
          {isShared && (
            <Badge variant="outline" className="text-xs gap-1">
              <Users className="w-3 h-3" />
              Shared
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6" data-testid="notes-page">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Notes</h2>
          <p className="text-slate-600 mt-1">Create and organize your notes</p>
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
                    value={newFolder.name}
                    onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
                    placeholder="e.g., Work Notes"
                    data-testid="input-folder-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={newFolder.color}
                      onChange={(e) => setNewFolder({ ...newFolder, color: e.target.value })}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={newFolder.color}
                      onChange={(e) => setNewFolder({ ...newFolder, color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewFolderDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateFolder}>Create Folder</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={newNoteDialog} onOpenChange={setNewNoteDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="create-note-btn">
                <Plus className="w-4 h-4" />
                New Note
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Note</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                    placeholder="Note title"
                    data-testid="input-note-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    placeholder="Start writing..."
                    rows={6}
                    data-testid="input-note-content"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Folder</Label>
                    <Select
                      value={newNote.folder_id || 'none'}
                      onValueChange={(value) => setNewNote({ ...newNote, folder_id: value === 'none' ? null : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No folder" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No folder</SelectItem>
                        {folders.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <Select
                      value={newNote.color || 'none'}
                      onValueChange={(value) => setNewNote({ ...newNote, color: value === 'none' ? null : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Default" />
                      </SelectTrigger>
                      <SelectContent>
                        {colors.map((c) => (
                          <SelectItem key={c.name} value={c.value || 'none'}>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded border" style={{ backgroundColor: c.value || '#fff' }} />
                              {c.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add tag..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(newNote, setNewNote))}
                    />
                    <Button type="button" variant="outline" onClick={() => addTag(newNote, setNewNote)}>Add</Button>
                  </div>
                  {newNote.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {newNote.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button onClick={() => removeTag(tag, newNote, setNewNote)} className="ml-1 hover:text-rose-500">&times;</button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewNoteDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateNote} data-testid="submit-note-btn">Create Note</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Folders Sidebar */}
        <div className="w-64 shrink-0">
          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Folder className="w-4 h-4" />
                Folders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <button
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedFolder === null ? 'bg-primary text-white' : 'hover:bg-slate-100'
                }`}
                onClick={() => setSelectedFolder(null)}
              >
                All Notes
              </button>
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                    selectedFolder === folder.id ? 'bg-primary text-white' : 'hover:bg-slate-100'
                  }`}
                  onClick={() => setSelectedFolder(folder.id)}
                >
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: folder.color }} />
                  {folder.name}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Notes Grid */}
        <div className="flex-1">
          <Tabs defaultValue="my-notes" className="w-full">
            <div className="flex items-center justify-between mb-6">
              <TabsList>
                <TabsTrigger value="my-notes" className="gap-2" data-testid="tab-my-notes">
                  <StickyNote className="w-4 h-4" />
                  My Notes
                </TabsTrigger>
                <TabsTrigger value="shared" className="gap-2" data-testid="tab-shared">
                  <Share2 className="w-4 h-4" />
                  Shared with Me
                </TabsTrigger>
              </TabsList>
              <div className="relative w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-notes-input"
                />
              </div>
            </div>

            <TabsContent value="my-notes">
              {pinnedNotes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Pin className="w-4 h-4" /> Pinned
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pinnedNotes.map((note) => (
                      <NoteCard key={note.id} note={note} />
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {regularNotes.length === 0 && pinnedNotes.length === 0 ? (
                  <Card className="col-span-full bg-white border-slate-200">
                    <CardContent className="p-12 text-center">
                      <StickyNote className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-heading font-semibold text-slate-900 mb-2">No notes yet</h3>
                      <p className="text-slate-600">Create your first note to get started</p>
                    </CardContent>
                  </Card>
                ) : (
                  regularNotes.map((note) => (
                    <NoteCard key={note.id} note={note} />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="shared">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sharedNotes.length === 0 ? (
                  <Card className="col-span-full bg-white border-slate-200">
                    <CardContent className="p-12 text-center">
                      <Share2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-heading font-semibold text-slate-900 mb-2">No shared notes</h3>
                      <p className="text-slate-600">Notes shared with you will appear here</p>
                    </CardContent>
                  </Card>
                ) : (
                  sharedNotes.map((note) => (
                    <NoteCard key={note.id} note={note} isShared />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Note Dialog */}
      <Dialog open={editNoteDialog} onOpenChange={setEditNoteDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>
          {selectedNote && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={selectedNote.title}
                  onChange={(e) => setSelectedNote({ ...selectedNote, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={selectedNote.content}
                  onChange={(e) => setSelectedNote({ ...selectedNote, content: e.target.value })}
                  rows={8}
                />
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant={selectedNote.is_pinned ? 'default' : 'outline'}
                  size="sm"
                  className="gap-2"
                  onClick={() => setSelectedNote({ ...selectedNote, is_pinned: !selectedNote.is_pinned })}
                >
                  <Pin className="w-4 h-4" />
                  {selectedNote.is_pinned ? 'Pinned' : 'Pin'}
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              className="text-rose-600"
              onClick={() => {
                if (selectedNote) handleDeleteNote(selectedNote.id);
                setEditNoteDialog(false);
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button variant="outline" onClick={() => setEditNoteDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateNote}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotesPage;
