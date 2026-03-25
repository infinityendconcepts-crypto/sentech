import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { eventsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  Plus,
  CalendarDays,
  MapPin,
  Clock,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Users,
  AlertCircle,
  Coffee,
  Star,
  Flag,
} from 'lucide-react';

const EVENT_TYPES = [
  { value: 'event', label: 'Event', color: '#0056B3', icon: Star },
  { value: 'meeting', label: 'Meeting', color: '#7C3AED', icon: Users },
  { value: 'deadline', label: 'Deadline', color: '#DC2626', icon: Flag },
  { value: 'holiday', label: 'Holiday', color: '#059669', icon: Coffee },
  { value: 'reminder', label: 'Reminder', color: '#D97706', icon: AlertCircle },
];

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const getEventTypeInfo = (type) => EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[0];

const EventsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles?.some(r => ['super_admin', 'admin'].includes(r));
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('month'); // month | list
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const emptyForm = {
    title: '',
    description: '',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '',
    start_time: '',
    end_time: '',
    location: '',
    event_type: 'event',
    color: '#0056B3',
    all_day: true,
    attendees: [],
  };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await eventsAPI.getAll();
      setEvents(res.data);
    } catch {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingEvent(null);
    setForm(emptyForm);
    setShowDialog(true);
  };

  const openEdit = (evt) => {
    setEditingEvent(evt);
    setForm({
      title: evt.title || '',
      description: evt.description || '',
      start_date: evt.start_date || '',
      end_date: evt.end_date || '',
      start_time: evt.start_time || '',
      end_time: evt.end_time || '',
      location: evt.location || '',
      event_type: evt.event_type || 'event',
      color: evt.color || '#0056B3',
      all_day: evt.all_day ?? true,
      attendees: evt.attendees || [],
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.start_date) { toast.error('Start date is required'); return; }
    setSaving(true);
    try {
      if (editingEvent) {
        await eventsAPI.update(editingEvent.id, form);
        toast.success('Event updated');
      } else {
        await eventsAPI.create(form);
        toast.success('Event created');
      }
      setShowDialog(false);
      fetchEvents();
    } catch {
      toast.error('Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await eventsAPI.delete(id);
      toast.success('Event deleted');
      setDeleteConfirm(null);
      setSelectedEvent(null);
      fetchEvents();
    } catch {
      toast.error('Failed to delete event');
    }
  };

  const handleTypeChange = (type) => {
    const info = getEventTypeInfo(type);
    setForm(f => ({ ...f, event_type: type, color: info.color }));
  };

  // Calendar helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const getEventsForDate = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.start_date <= dateStr && (e.end_date ? e.end_date >= dateStr : e.start_date === dateStr));
  };

  const today = new Date();
  const isToday = (day) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  // Upcoming events for list view
  const todayStr = today.toISOString().slice(0, 10);
  const upcomingEvents = [...events]
    .filter(e => e.start_date >= todayStr)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Events</h2>
          <p className="text-slate-600 mt-1">Manage your schedule and upcoming events</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setView(v => v === 'month' ? 'list' : 'month')}>
            {view === 'month' ? 'List View' : 'Calendar View'}
          </Button>
          {isAdmin && (
            <Button onClick={openCreate} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Event
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {EVENT_TYPES.map(type => {
          const count = events.filter(e => e.event_type === type.value).length;
          return (
            <Card key={type.value} className="bg-white border-slate-200">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: type.color + '20' }}>
                  <type.icon className="w-5 h-5" style={{ color: type.color }} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{count}</p>
                  <p className="text-xs text-slate-500">{type.label}s</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {view === 'month' ? (
        /* ---- CALENDAR VIEW ---- */
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
                <h3 className="text-lg font-semibold text-slate-900">{MONTHS[month]} {year}</h3>
                <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
              </div>
              <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-slate-100">
              {DAYS.map(d => (
                <div key={d} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase">{d}</div>
              ))}
            </div>
            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {/* Empty cells before first day */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[90px] border-b border-r border-slate-100 bg-slate-50/50" />
              ))}
              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayEvents = getEventsForDate(day);
                const today_cell = isToday(day);
                return (
                  <div
                    key={day}
                    className={`min-h-[90px] border-b border-r border-slate-100 p-1 ${today_cell ? 'bg-blue-50' : 'hover:bg-slate-50'} transition-colors`}
                  >
                    <div className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${today_cell ? 'bg-primary text-white' : 'text-slate-700'}`}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map(evt => {
                        const typeInfo = getEventTypeInfo(evt.event_type);
                        return (
                          <div
                            key={evt.id}
                            className="text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                            style={{ backgroundColor: (evt.color || typeInfo.color) + '20', color: evt.color || typeInfo.color, borderLeft: `3px solid ${evt.color || typeInfo.color}` }}
                            onClick={() => setSelectedEvent(evt)}
                          >
                            {evt.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-slate-500 px-1">+{dayEvents.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* ---- LIST VIEW ---- */
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-16">
                <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No upcoming events</p>
                {isAdmin && (
                  <Button onClick={openCreate} className="mt-4 gap-2" variant="outline">
                    <Plus className="w-4 h-4" /> Add Event
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {upcomingEvents.map(evt => {
                  const typeInfo = getEventTypeInfo(evt.event_type);
                  return (
                    <div key={evt.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (evt.color || typeInfo.color) + '20' }}>
                        <typeInfo.icon className="w-6 h-6" style={{ color: evt.color || typeInfo.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-slate-900 truncate">{evt.title}</p>
                          <Badge variant="outline" className="text-xs capitalize">{evt.event_type}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{evt.start_date}{evt.start_time ? ` at ${evt.start_time}` : ''}</span>
                          {evt.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{evt.location}</span>}
                        </div>
                        {evt.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{evt.description}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(evt)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600" onClick={() => setDeleteConfirm(evt.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Event Detail Popup */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="bg-white max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: (selectedEvent.color || '#0056B3') + '20' }}>
                  {(() => { const T = getEventTypeInfo(selectedEvent.event_type); return <T.icon className="w-5 h-5" style={{ color: selectedEvent.color || '#0056B3' }} />; })()}
                </div>
                <DialogTitle className="text-slate-900">{selectedEvent.title}</DialogTitle>
              </div>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-4 h-4" />
                <span>{selectedEvent.start_date}{selectedEvent.start_time ? ` at ${selectedEvent.start_time}` : ''}</span>
                {selectedEvent.end_date && selectedEvent.end_date !== selectedEvent.start_date && (
                  <span>→ {selectedEvent.end_date}</span>
                )}
              </div>
              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}
              {selectedEvent.description && (
                <p className="text-slate-600 bg-slate-50 rounded p-3">{selectedEvent.description}</p>
              )}
              <Badge variant="outline" className="capitalize">{selectedEvent.event_type}</Badge>
            </div>
            <DialogFooter className="gap-2">
              {isAdmin && (
                <>
                  <Button variant="outline" onClick={() => { setSelectedEvent(null); openEdit(selectedEvent); }}>
                    <Edit2 className="w-4 h-4 mr-2" /> Edit
                  </Button>
                  <Button variant="destructive" onClick={() => { setDeleteConfirm(selectedEvent.id); setSelectedEvent(null); }}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-900">{editingEvent ? 'Edit Event' : 'Add New Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                className="mt-1"
                placeholder="Event title"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Event Type</Label>
                <Select value={form.event_type} onValueChange={handleTypeChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    className="h-9 w-16 rounded border border-slate-200 cursor-pointer p-0.5"
                  />
                  <span className="text-sm text-slate-500">{form.color}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date *</Label>
                <Input type="date" className="mt-1" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" className="mt-1" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="all_day"
                checked={form.all_day}
                onChange={e => setForm(f => ({ ...f, all_day: e.target.checked }))}
                className="w-4 h-4 accent-primary"
              />
              <Label htmlFor="all_day" className="cursor-pointer">All day event</Label>
            </div>
            {!form.all_day && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <Input type="time" className="mt-1" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input type="time" className="mt-1" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
                </div>
              </div>
            )}
            <div>
              <Label>Location</Label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input className="pl-9" placeholder="e.g. Conference Room A, Zoom" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                className="mt-1"
                rows={3}
                placeholder="Event description..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? 'Saving...' : (editingEvent ? 'Update Event' : 'Create Event')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="bg-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600 text-sm">Are you sure you want to delete this event? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleDelete(deleteConfirm)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventsPage;
