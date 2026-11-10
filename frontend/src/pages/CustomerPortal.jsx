import React, { useState, useEffect, useRef } from 'react';
import api, { socket } from '../api';
import {
  HelpCircle, Plus, Sun, Moon, User, LogOut, Ticket as TicketIcon,
  Inbox, Clock, CheckCircle2, Search, Send, X, Star, Sparkles, Paperclip
} from 'lucide-react';

export default function CustomerPortal({ user, darkMode, setDarkMode, onLogout }) {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [faqs, setFaqs] = useState([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({ subject: '', category: 'Technical Bug', CustomerCompany: user.company || '', messageText: '', attachmentUrl: '' });
  const [submitting, setSubmitting] = useState(false);

  const [ratingVal, setRatingVal] = useState(5);
  const [csatFeedback, setCsatFeedback] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMyData();
    socket.on('ticket_created', (newTkt) => {
      if (newTkt.customerEmail?.toLowerCase() === user.email?.toLowerCase()) {
        setTickets((prev) => (prev.some((t) => t._id === newTkt._id) ? prev : [newTkt, ...prev]));
      }
    });
    socket.on('ticket_updated', (updated) => {
      if (updated.customerEmail?.toLowerCase() === user.email?.toLowerCase()) {
        setTickets((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
        setSelectedTicket((curr) => (curr && curr._id === updated._id ? updated : curr));
      }
    });
    return () => {
      socket.off('ticket_created');
      socket.off('ticket_updated');
    };
  }, [user.email]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [selectedTicket?.messages?.length]);

  const fetchMyData = async () => {
    try {
      const res = await api.get('/tickets');
      setTickets(res.data.tickets || []);
      setFaqs(res.data.faqs || []);
      if ((res.data.tickets || []).length > 0 && !selectedTicket) setSelectedTicket(res.data.tickets[0]);
    } catch (err) {
      if (err.response?.status === 401) onLogout();
    }
  };

  const handleFileChange = (e, targetFormSetter) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        targetFormSetter((prev) => ({ ...prev, attachmentUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/tickets', newTicketForm);
      setTickets((prev) => [res.data, ...prev]);
      setSelectedTicket(res.data);
      setNewTicketForm({ subject: '', category: 'Technical Bug', CustomerCompany: user.company || '', messageText: '', attachmentUrl: '' });
      setShowCreateModal(false);
    } catch (err) {
      alert('Failed to raise ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const [chatAttachment, setChatAttachment] = useState('');
  const handleSendMessage = async () => {
    if (!replyText.trim() && !chatAttachment) return;
    try {
      const res = await api.post(`/tickets/${selectedTicket._id}/messages`, { text: replyText, attachmentUrl: chatAttachment });
      setSelectedTicket(res.data);
      setReplyText('');
      setChatAttachment('');
    } catch (err) {
      alert('Failed to send');
    }
  };

  const handleSumbitCsat = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/tickets/${selectedTicket._id}/csat`, { rating: ratingVal, feedback: csatFeedback });
      setSelectedTicket(res.data);
      setRatingSubmitted(true);
    } catch (err) {
      alert('Failed rating');
    }
  };

  const matchingFaqs = faqs.filter((faq) => {
    if (!newTicketForm.subject) return false;
    const sub = newTicketForm.subject.toLowerCase();
    return faq.keywords.some((kw) => sub.includes(kw));
  });

  const getStatusBadgeStyle = (status) => {
    const map = {
      Open: darkMode ? 'bg-amber-500/10 text-amber-300 border-amber-500/25' : 'bg-amber-50 text-amber-700 border-amber-200',
      'In Progress': darkMode ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' : 'bg-indigo-50 text-indigo-700 border-indigo-200',
      Resolved: darkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Closed: darkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
    };
    return map[status] || map.Open;
  };

  const filteredTickets = tickets.filter((t) => filterStatus === 'All' || t.status === filterStatus);
  const visibleMessages = selectedTicket ? (selectedTicket.messages || []).filter((m) => !m.isInternalNote && m.senderRole !== 'AI') : [];

  return (
    <div className={`${darkMode ? 'dark bg-[#0B0D13] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'} min-h-screen flex flex-col font-sans transition-colors`}>
      <header className={`h-14 border-b px-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur-xl ${darkMode ? 'border-white/[0.07] bg-[#0B0D13]/90' : 'border-slate-200 bg-white/95'}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 border border-indigo-400/30 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div className="flex items-center">
            <span className="font-bold text-base tracking-tight">Resolve</span><span className="font-bold text-base tracking-tight text-indigo-400">AI</span>
            <span className="ml-2.5 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">Customer Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button onClick={() => setShowCreateModal(true)} className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-500/20 transition">
            <Plus className="w-4 h-4" /> Raise New Ticket
          </button>
          <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-lg border cursor-pointer ${darkMode ? 'bg-[#12151E] border-white/10 text-amber-400' : 'bg-white border-slate-200 text-slate-700'}`}>
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={onLogout} className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-semibold border border-rose-500/20 cursor-pointer flex items-center gap-1">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col p-6 gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Tickets', val: tickets.length, icon: TicketIcon },
            { label: 'Open', val: tickets.filter((t) => t.status === 'Open').length, icon: Inbox },
            { label: 'In Progress', val: tickets.filter((t) => ['In Progress', 'Waiting on Customer'].includes(t.status)).length, icon: Clock },
            { label: 'Resolved', val: tickets.filter((t) => ['Resolved', 'Closed'].includes(t.status)).length, icon: CheckCircle2 }
          ].map((stat, i) => (
            <div key={i} className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-[#12151E] border-white/[0.07]' : 'bg-white border-slate-200'}`}>
              <div><p className="text-xs font-medium text-slate-400">{stat.label}</p><p className="text-2xl font-extrabold font-mono mt-1">{stat.val}</p></div>
              <stat.icon className="w-5 h-5 text-indigo-400" />
            </div>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-125">
          <div className={`lg:col-span-5 rounded-xl border flex flex-col overflow-hidden ${darkMode ? 'bg-[#12151E] border-white/[0.07]' : 'bg-white border-slate-200'}`}>
            <div className={`p-4 border-b space-y-3 ${darkMode ? 'border-white/[0.07]' : 'border-slate-200'}`}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">My Support Requests</h3>
              <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none ${darkMode ? 'bg-[#0B0D13] border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`} />
            </div>
            <div className={`flex-1 overflow-y-auto divide-y ${darkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
              {filteredTickets.map((tkt) => (
                <div key={tkt._id} onClick={() => setSelectedTicket(tkt)} className={`p-4 cursor-pointer transition ${selectedTicket?._id === tkt._id ? darkMode ? 'bg-indigo-500/10 border-l-2 border-l-indigo-400' : 'bg-indigo-50/70 border-l-2 border-l-indigo-600' : 'hover:bg-white/2'}`}>
                  <div className="flex justify-between mb-1"><span className="font-mono text-xs font-bold text-indigo-400">{tkt.ticketId}</span><span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${getStatusBadgeStyle(tkt.status)}`}>{tkt.status}</span></div>
                  <h4 className="text-xs font-semibold line-clamp-1">{tkt.subject}</h4>
                </div>
              ))}
            </div>
          </div>

          <div className={`lg:col-span-7 rounded-xl border flex flex-col overflow-hidden ${darkMode ? 'bg-[#12151E] border-white/[0.07]' : 'bg-white border-slate-200'}`}>
            {selectedTicket ? (
              <>
                <div className={`p-5 border-b space-y-4 ${darkMode ? 'border-white/[0.07]' : 'border-slate-200'}`}>
                  <h2 className="text-base font-bold">{selectedTicket.subject}</h2>
                  {['Resolved', 'Closed'].includes(selectedTicket.status) && !selectedTicket.csatRating && !ratingSubmitted && (
                    <form onSubmit={handleSumbitCsat} className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-2">
                      <p className="text-xs font-bold text-amber-400">Rate your support experience:</p>
                      <div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" onClick={() => setRatingVal(n)} className={`w-7 h-7 rounded text-xs font-bold cursor-pointer ${ratingVal >= n ? 'bg-amber-400 text-slate-950' : 'bg-[#0B0D13] text-white'}`}>{n}★</button>)}</div>
                      <button type="submit" className="px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded cursor-pointer">Submit Rating</button>
                    </form>
                  )}
                </div>
                <div className={`flex-1 overflow-y-auto p-5 space-y-4 max-h-75 ${darkMode ? 'bg-[#0B0D13]/60' : 'bg-slate-50'}`}>
                  {visibleMessages.map((m, i) => (
                    <div key={i} className={`flex flex-col ${m.senderRole === 'Customer' ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-xl rounded-xl p-4 border ${m.senderRole === 'Customer' ? 'bg-indigo-600 text-white border-indigo-500 font-medium' : darkMode ? 'bg-[#161A26] border-white/8 text-white' : 'bg-white border-slate-200'}`}>
                        <p className="text-xs">{m.text}</p>
                        {m.attachmentUrl && (
                          <div className="mt-2">
                            <img src={m.attachmentUrl} alt="attachment" className="max-h-40 rounded-lg border border-black/20 object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div className={`p-4 border-t ${darkMode ? 'border-white/[0.07] bg-[#12151E]' : 'border-slate-200 bg-white'}`}>
                  {chatAttachment && (
                    <div className="mb-2 flex items-center gap-2 bg-[#0B0D13] p-2 rounded-lg text-xs">
                      <span className="truncate max-w-xs">📎 Attachment loaded</span>
                      <button onClick={() => setChatAttachment('')} className="text-rose-400 font-bold ml-auto cursor-pointer">Remove</button>
                    </div>
                  )}
                  <div className="flex gap-2 items-center">
                    <label className={`p-2.5 rounded-lg border cursor-pointer ${darkMode ? 'border-white/10 bg-[#0B0D13] text-slate-400 hover:text-white' : 'border-slate-200 bg-slate-50'}`}>
                      <Paperclip className="w-4 h-4" />
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, (updater) => {
                        const val = typeof updater === 'function' ? updater({ attachmentUrl: chatAttachment }) : updater;
                        setChatAttachment(val.attachmentUrl);
                      })} className="hidden" />
                    </label>
                    <input type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Write message..." className={`flex-1 border rounded-lg px-4 py-2 text-xs focus:outline-none ${darkMode ? 'bg-[#0B0D13] border-white/10 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200'}`} />
                    <button onClick={handleSendMessage} className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs cursor-pointer"><Send className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">Select ticket</div>
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border p-6 ${darkMode ? 'bg-[#12151E] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <h3 className="text-base font-bold mb-4">Raise Support Ticket</h3>
            <form onSubmit={handleRaiseTicket} className="space-y-4">
              <input required value={newTicketForm.subject} onChange={(e) => setNewTicketForm({ ...newTicketForm, subject: e.target.value })} placeholder="Subject" className={`w-full border rounded-lg px-3 py-2 text-xs ${darkMode ? 'bg-[#0B0D13] border-white/10 text-white' : 'bg-slate-50 border-slate-300'}`} />
              {matchingFaqs.length > 0 && (
                <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300">
                  <Sparkles className="w-3.5 h-3.5 inline mr-1" /> <strong>FAQ Match:</strong> {matchingFaqs[0].content}
                </div>
              )}
              <textarea required rows={4} value={newTicketForm.messageText} onChange={(e) => setNewTicketForm({ ...newTicketForm, messageText: e.target.value })} placeholder="Description..." className={`w-full border rounded-lg p-3 text-xs ${darkMode ? 'bg-[#0B0D13] border-white/10 text-white' : 'bg-slate-50 border-slate-300'}`} />
              
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Attach Screenshot / Image</label>
                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setNewTicketForm)} className="text-xs" />
                {newTicketForm.attachmentUrl && <p className="text-[10px] text-emerald-400 mt-1">✓ Image attached successfully</p>}
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-white/10 rounded-lg text-xs font-semibold cursor-pointer">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs cursor-pointer">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}