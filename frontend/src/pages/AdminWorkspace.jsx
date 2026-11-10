import React, { useState, useEffect, useRef, useMemo } from 'react';
import api, { socket } from '../api';
import {
  Zap, Inbox, BarChart3, Users, Sun, Moon, Shield, LogOut,
  Search, Eye, Trash2, Sparkles, Lock, Bot, MessageSquare,
  CheckCircle2, Send, Download, Star, Paperclip, Bell, BookOpen,
  Activity, Command, CheckSquare, Square, Kanban, AlertTriangle, Radio, GitMerge, Mic, Square as StopIcon,
  Trophy, Globe, Award
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export default function AdminWorkspace({ user, darkMode, setDarkMode, onLogout }) {
  const [tickets, setTickets] = useState([]);
  const [agentsList, setAgentsList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [macrosList, setMacrosList] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'kanban' | 'analytics' | 'macros' | 'users' | 'kb' | 'audit' | 'leaderboard'
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [replyText, setReplyText] = useState('');
  const [chatAttachment, setChatAttachment] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  // AI Thread Summarizer State
  const [aiSummarizing, setAiSummarizing] = useState(false);
  const [customAiSummary, setCustomAiSummary] = useState({});

  // Knowledge Base State
  const [kbSearch, setKbSearch] = useState('');
  const kbArticles = [
    { id: 1, title: 'How to Reset User Password & 2FA Tokens', category: 'Security & Access', views: '1.2k', content: 'Navigate to user profile -> Security tab -> Click "Reset Two-Factor Authentication" or send temporary reset link.' },
    { id: 2, title: 'Resolving Stripe Billing & Refund Failures', category: 'Billing Dept', views: '840', content: 'Check Stripe Dashboard logs for card declination codes. If webhook failed, manually trigger invoice sync from Admin Billing tools.' },
    { id: 3, title: 'Troubleshooting Live Socket.io Connection Drops', category: 'Technical Support', views: '2.5k', content: 'Ensure CORS headers allow credentials and check Nginx proxy reverse connection timeout settings for WebSocket protocol upgrade.' },
    { id: 4, title: 'Setting Up Custom SLA Escalation Rules', category: 'General Inquiries', views: '610', content: 'Go to Admin Settings -> SLA Policies. Define breach thresholds based on ticket priority levels (Urgent: 2h, High: 4h).' }
  ];

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([
    { id: 101, action: 'TICKET_CREATED', performedBy: 'Customer Portal', details: 'New support ticket initialized via web form', timestamp: new Date(Date.now() - 3600000).toLocaleTimeString() },
    { id: 102, action: 'AI_TRIAGE_RUN', performedBy: 'ResolveAI Copilot', details: 'Automated categorization and sentiment analysis completed', timestamp: new Date(Date.now() - 3500000).toLocaleTimeString() },
    { id: 103, action: 'AGENT_ASSIGNED', performedBy: user.name, details: `Ticket routed to ${user.role} workspace queue`, timestamp: new Date(Date.now() - 1800000).toLocaleTimeString() },
    { id: 104, action: 'SLA_TIMER_STARTED', performedBy: 'System Core', details: 'Second-by-second countdown initialized with priority weight', timestamp: new Date(Date.now() - 1700000).toLocaleTimeString() }
  ]);

  // Command Palette & Bulk Actions State
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [selectedTicketIds, setSelectedTicketIds] = useState([]);

  // Kanban Drag-and-Drop State
  const [draggedTicketId, setDraggedTicketId] = useState(null);

  // Live Collision Detection State
  const [activeViewers, setActiveViewers] = useState([]);
  const [typingAgents, setTypingAgents] = useState({});
  const [simulatedCollider, setSimulatedCollider] = useState(null);

  // Ticket Merging State
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [isMerging, setIsMerging] = useState(false);

  // Voice Note Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // ✅ FEATURE #12 STATE: Auto-Translate Cache for Messages
  const [translatedMessages, setTranslatedMessages] = useState({});

  const [now, setNow] = useState(Date.now());
  const [newMacro, setNewMacro] = useState({ title: '', category: 'General', content: '' });

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const collisionChannelRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('resolveai_collision_channel');
      collisionChannelRef.current = channel;

      channel.onmessage = (event) => {
        const { type, ticketId, agentName, isTyping } = event.data || {};
        if (type === 'AGENT_TYPING') {
          setTypingAgents((prev) => ({
            ...prev,
            [ticketId]: isTyping ? agentName : null
          }));
        }
      };

      return () => channel.close();
    }
  }, []);

  useEffect(() => {
    fetchWorkspace();
    const timer = setInterval(() => setNow(Date.now()), 1000);

    socket.on('ticket_created', (newTkt) => {
      setTickets((prev) => (prev.some((t) => t._id === newTkt._id) ? prev : [newTkt, ...prev]));
      setSelectedTicket((curr) => curr || newTkt);
      setAuditLogs((prev) => [{ id: Date.now(), action: 'SOCKET_TICKET_CREATED', performedBy: newTkt.customerName || 'Customer', details: `Created ticket ${newTkt.ticketId}`, timestamp: new Date().toLocaleTimeString() }, ...prev]);
    });
    socket.on('ticket_updated', (updated) => {
      setTickets((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
      setSelectedTicket((curr) => (curr && curr._id === updated._id ? updated : curr));
    });
    socket.on('ticket_deleted', (id) => {
      setTickets((prev) => prev.filter((t) => t._id !== id));
      setSelectedTicket((curr) => (curr && curr._id === id ? null : curr));
      setAuditLogs((prev) => [{ id: Date.now(), action: 'TICKET_DELETED', performedBy: user.name, details: `Deleted ticket ID ${id}`, timestamp: new Date().toLocaleTimeString() }, ...prev]);
    });
    socket.on('macro_created', (mac) => setMacrosList((prev) => [...prev, mac]));
    socket.on('ticket_viewers_update', (viewers) => setActiveViewers(viewers || []));

    socket.on('agent_typing', ({ ticketId, agentName, isTyping }) => {
      if (agentName !== user.name) {
        setTypingAgents((prev) => ({
          ...prev,
          [ticketId]: isTyping ? agentName : null
        }));
      }
    });

    socket.on('new_notification', (notif) => {
      if (notif.recipientEmail?.toLowerCase() === user.email?.toLowerCase()) {
        setNotifications((prev) => [notif, ...prev]);
        setToastMessage(notif.message);
        setTimeout(() => setToastMessage(null), 4000);
      }
    });

    return () => {
      clearInterval(timer);
      socket.off('ticket_created');
      socket.off('ticket_updated');
      socket.off('ticket_deleted');
      socket.off('macro_created');
      socket.off('ticket_viewers_update');
      socket.off('agent_typing');
      socket.off('new_notification');
    };
  }, [user.email, user.name]);

  useEffect(() => {
    if (!selectedTicket) return;
    socket.emit('join_ticket', { ticketId: selectedTicket.ticketId, agentName: user.name });
    setSimulatedCollider(null);
    setMergeTargetId('');
    setTranslatedMessages({});
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    return () => {
      socket.emit('leave_ticket', { ticketId: selectedTicket.ticketId, agentName: user.name });
    };
  }, [selectedTicket?._id, user.name]);

  const fetchWorkspace = async () => {
    try {
      const res = await api.get('/tickets');
      const list = Array.isArray(res.data) ? res.data : (res.data.tickets || []);
      setTickets(list);
      setAgentsList(res.data.agents || []);
      setUsersList(res.data.users || []);
      setMacrosList(res.data.macros || []);
      setNotifications(res.data.notifications || []);
      if (list.length > 0 && !selectedTicket) setSelectedTicket(list[0]);
    } catch (err) {
      if (err.response?.status === 401) onLogout();
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      await api.post('/notifications/read');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {}
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setChatAttachment(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setChatAttachment(reader.result);
          if (!replyText.trim()) {
            setReplyText('🎙️ Attached a voice note update.');
          }
          setToastMessage('🎙️ Voice Note recorded & attached!');
          setTimeout(() => setToastMessage(null), 3000);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone permission is required to record voice notes.');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const handleReplyTyping = (val) => {
    setReplyText(val);
    if (!selectedTicket) return;

    const payload = { ticketId: selectedTicket.ticketId, agentName: user.name, isTyping: val.length > 0 };
    socket.emit('agent_typing', payload);
    collisionChannelRef.current?.postMessage({ type: 'AGENT_TYPING', ...payload });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      const stopPayload = { ticketId: selectedTicket.ticketId, agentName: user.name, isTyping: false };
      socket.emit('agent_typing', stopPayload);
      collisionChannelRef.current?.postMessage({ type: 'AGENT_TYPING', ...stopPayload });
    }, 2500);
  };

  const toggleSimulateCollision = () => {
    if (!selectedTicket) return;
    if (simulatedCollider) {
      setSimulatedCollider(null);
      setTypingAgents((prev) => ({ ...prev, [selectedTicket.ticketId]: null }));
    } else {
      const mockAgent = 'Priya Sharma (Senior Agent)';
      setSimulatedCollider({ agentName: mockAgent, status: 'typing' });
      setTypingAgents((prev) => ({ ...prev, [selectedTicket.ticketId]: mockAgent }));
      setToastMessage(`⚠️ Collision Alert: ${mockAgent} is also viewing & typing on ${selectedTicket.ticketId}`);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // ✅ FEATURE #12: Simulated Multi-Language Auto-Translate Handler
  const handleTranslateMessage = (index, originalText) => {
    if (translatedMessages[index]) {
      setTranslatedMessages((prev) => ({ ...prev, [index]: null })); // toggle back
      return;
    }
    let translated = `[Translated to English]: ${originalText}`;
    if (originalText.toLowerCase().includes('bhai') || originalText.toLowerCase().includes('nahi') || originalText.toLowerCase().includes('kya')) {
      translated = `[Auto-Translated from Hinglish]: "Hey team, I am facing issues with my account access, please help resolve this as soon as possible."`;
    } else {
      translated = `[Auto-Translated]: "The issue reported regarding ${originalText.slice(0, 40)}... has been verified in our logs and is being addressed."`;
    }
    setTranslatedMessages((prev) => ({ ...prev, [index]: translated }));
    setToastMessage('🌐 Message auto-translated to English!');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSendMessage = async (customStatus = null) => {
    if (!replyText.trim() && !chatAttachment) return;
    try {
      const isVoice = chatAttachment?.startsWith('data:audio');
      const res = await api.post(`/tickets/${selectedTicket._id}/messages`, {
        text: replyText,
        attachmentUrl: chatAttachment,
        isInternalNote,
        newStatus: customStatus
      });
      setSelectedTicket(res.data);
      setReplyText('');
      setChatAttachment('');
      socket.emit('agent_typing', { ticketId: selectedTicket.ticketId, agentName: user.name, isTyping: false });
      setAuditLogs((prev) => [
        {
          id: Date.now(),
          action: isVoice ? 'VOICE_NOTE_SENT' : isInternalNote ? 'INTERNAL_NOTE_ADDED' : 'PUBLIC_REPLY_SENT',
          performedBy: user.name,
          details: `Responded to ticket ${selectedTicket.ticketId}${isVoice ? ' with audio voice note' : ''}`,
          timestamp: new Date().toLocaleTimeString()
        },
        ...prev
      ]);
    } catch (err) {
      alert('Failed to send message');
    }
  };

  const handleGenerateAIDraft = async () => {
    if (!selectedTicket) return;
    try {
      setAiGenerating(true);
      setIsInternalNote(false);
      const res = await api.post(`/tickets/${selectedTicket._id}/ai-draft`);
      const draftText = res.data?.draft;
      if (draftText) {
        setReplyText(draftText);
        setToastMessage(res.data.provider === 'gemini' ? 'AI draft generated with Gemini.' : 'AI draft generated.');
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate AI reply. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSummarizeThread = async () => {
    if (!selectedTicket) return;
    try {
      setAiSummarizing(true);
      let summaryText = '';
      try {
        const res = await api.post(`/tickets/${selectedTicket._id}/ai-copilot`, { mode: 'summarize' });
        summaryText = res.data?.suggestion || res.data?.summary;
      } catch (innerErr) {
        const msgs = selectedTicket.messages || [];
        const msgCount = msgs.length;
        const lastMsg = msgs[msgs.length - 1]?.text || selectedTicket.subject || 'No recent messages';
        summaryText = `Customer ${selectedTicket.customerName} reported "${selectedTicket.subject}" (${selectedTicket.priority} Priority, ${msgCount} message${msgCount === 1 ? '' : 's'}). Latest update: "${lastMsg.slice(0, 90)}"`;
      }
      setCustomAiSummary((prev) => ({ ...prev, [selectedTicket._id]: summaryText }));
      setToastMessage('✨ AI Thread Summary Updated!');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setAiSummarizing(false);
    }
  };

  const handleUpdateField = async (field, value, customTicketId = null) => {
    const targetId = customTicketId || selectedTicket?._id;
    if (!targetId) return;
    const res = await api.put(`/tickets/${targetId}`, { [field]: value });
    setTickets((prev) => prev.map((t) => (t._id === targetId ? res.data : t)));
    if (selectedTicket?._id === targetId) setSelectedTicket(res.data);
    setAuditLogs((prev) => [{ id: Date.now(), action: `FIELD_UPDATED_${field.toUpperCase()}`, performedBy: user.name, details: `Changed ${field} to "${value}"`, timestamp: new Date().toLocaleTimeString() }, ...prev]);
  };

  const handleMergeTickets = async (customSourceId = null) => {
    const sourceId = customSourceId || mergeTargetId;
    if (!selectedTicket || !sourceId || sourceId === selectedTicket._id) return;

    const sourceTicket = tickets.find((t) => t._id === sourceId);
    if (!sourceTicket) return;

    try {
      setIsMerging(true);
      let updatedPrimary = null;

      try {
        const res = await api.post(`/tickets/${selectedTicket._id}/merge`, {
          secondaryTicketId: sourceId
        });
        updatedPrimary = res.data?.primaryTicket || res.data;
      } catch (innerErr) {
        const sourceMsgs = (sourceTicket.messages || []).map((m) => `[${m.senderName}]: ${m.text}`).join('\n');
        const mergeNoteText = `🔀 MERGED DUPLICATE TICKET (${sourceTicket.ticketId} — "${sourceTicket.subject}"):\n${sourceMsgs || 'No prior messages.'}`;

        const msgRes = await api.post(`/tickets/${selectedTicket._id}/messages`, {
          text: mergeNoteText,
          isInternalNote: true
        });
        updatedPrimary = msgRes.data;

        await api.put(`/tickets/${sourceId}`, { status: 'Closed' });
      }

      setSelectedTicket(updatedPrimary);
      setTickets((prev) =>
        prev.map((t) => {
          if (t._id === selectedTicket._id) return updatedPrimary;
          if (t._id === sourceId) return { ...t, status: 'Closed' };
          return t;
        })
      );

      setMergeTargetId('');
      setAuditLogs((prev) => [
        {
          id: Date.now(),
          action: 'TICKETS_MERGED',
          performedBy: user.name,
          details: `Merged duplicate ${sourceTicket.ticketId} into primary ticket ${selectedTicket.ticketId}`,
          timestamp: new Date().toLocaleTimeString()
        },
        ...prev
      ]);
      setToastMessage(`🔀 Merged ${sourceTicket.ticketId} into ${selectedTicket.ticketId}!`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      alert('Failed to merge tickets');
    } finally {
      setIsMerging(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedTicketIds.length === filteredTickets.length) {
      setSelectedTicketIds([]);
    } else {
      setSelectedTicketIds(filteredTickets.map((t) => t._id));
    }
  };

  const toggleSelectTicket = (id, e) => {
    e.stopPropagation();
    setSelectedTicketIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedTicketIds.length === 0) return;
    try {
      await Promise.all(selectedTicketIds.map((id) => api.put(`/tickets/${id}`, { status: newStatus })));
      setToastMessage(`⚡ Bulk updated ${selectedTicketIds.length} tickets to ${newStatus}!`);
      setTimeout(() => setToastMessage(null), 3500);
      setAuditLogs((prev) => [{ id: Date.now(), action: 'BULK_STATUS_UPDATE', performedBy: user.name, details: `Updated ${selectedTicketIds.length} tickets to ${newStatus}`, timestamp: new Date().toLocaleTimeString() }, ...prev]);
      setSelectedTicketIds([]);
      fetchWorkspace();
    } catch (err) {
      alert('Failed to execute bulk action');
    }
  };

  const handleKanbanDrop = async (targetStatus) => {
    if (!draggedTicketId) return;
    await handleUpdateField('status', targetStatus, draggedTicketId);
    setToastMessage(`📌 Moved ticket to ${targetStatus}!`);
    setTimeout(() => setToastMessage(null), 2500);
    setDraggedTicketId(null);
  };

  const getSlaBadge = (ticket) => {
    if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
      return {
        label: 'SLA Met ✓',
        color: darkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };
    }
    const slaHoursMap = { Urgent: 2, High: 4, Medium: 12, Low: 24 };
    const fallbackDeadline = (ticket.createdAt ? new Date(ticket.createdAt).getTime() : Date.now()) + (slaHoursMap[ticket.priority] || 12) * 3600000;
    const deadlineMs = ticket.slaDeadline ? new Date(ticket.slaDeadline).getTime() : fallbackDeadline;
    const diffMs = deadlineMs - now;

    if (diffMs <= 0) {
      return {
        label: 'BREACHED',
        color: 'bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse'
      };
    }

    const hrs = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);

    return {
      label: `⏱ ${String(hrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`,
      color: darkMode ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25 font-mono' : 'bg-indigo-50 text-indigo-700 border-indigo-200 font-mono'
    };
  };

  const getStatusPill = (status) => {
    const map = {
      Open: darkMode ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200',
      'In Progress': darkMode ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' : 'bg-indigo-50 text-indigo-700 border-indigo-200',
      Resolved: darkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Closed: darkMode ? 'bg-slate-800/80 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
    };
    return map[status] || map.Open;
  };

  const exportTicketsToCSV = () => {
    const headers = [
      'Ticket ID',
      'Subject',
      'Customer Name',
      'Customer Email',
      'Department',
      'Assigned Agent',
      'Status',
      'Priority',
      'SLA Status',
      'AI Category',
      'AI Sentiment',
      'Messages Count',
      'CSAT Rating'
    ];
    const rows = tickets.map((t) => [
      t.ticketId || t._id,
      `"${(t.subject || '').replace(/"/g, '""')}"`,
      `"${(t.customerName || 'N/A').replace(/"/g, '""')}"`,
      t.customerEmail || 'N/A',
      t.department || 'Technical Support',
      t.assignedTo || 'Unassigned',
      t.status,
      t.priority,
      getSlaBadge(t).label,
      t.aiCategory || 'General',
      t.aiSentiment || 'Neutral',
      (t.messages || []).length,
      t.csatRating || 'N/A'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `ResolveAI_Enterprise_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setAuditLogs((prev) => [
      {
        id: Date.now(),
        action: 'CSV_REPORT_EXPORTED',
        performedBy: user.name,
        details: `Exported ${tickets.length} tickets to CSV report`,
        timestamp: new Date().toLocaleTimeString()
      },
      ...prev
    ]);
    setToastMessage(`📊 Exported ${tickets.length} tickets to CSV Report!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
    const subjectText = t.subject || '';
    const idText = t.ticketId || '';
    const matchesSearch = subjectText.toLowerCase().includes(searchQuery.toLowerCase()) || idText.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredKb = kbArticles.filter((art) => art.title.toLowerCase().includes(kbSearch.toLowerCase()) || art.category.toLowerCase().includes(kbSearch.toLowerCase()));

  const categoryData = ['Technical Bug', 'Billing & Refund', 'Account Access', 'Feature Request', 'General Inquiry'].map((cat) => ({
    name: cat.split(' ')[0],
    count: tickets.filter((t) => t.aiCategory === cat).length
  }));

  const sentimentData = [
    { name: 'Urgent/Angry', value: tickets.filter((t) => ['Urgent', 'Angry'].includes(t.aiSentiment)).length, color: '#f43f5e' },
    { name: 'Frustrated', value: tickets.filter((t) => t.aiSentiment === 'Frustrated').length, color: '#f59e0b' },
    { name: 'Neutral/Happy', value: tickets.filter((t) => ['Neutral', 'Happy'].includes(t.aiSentiment)).length, color: '#10b981' }
  ];

  const csatRatedTickets = tickets.filter((t) => t.csatRating);
  const avgCsat = csatRatedTickets.length > 0 ? (csatRatedTickets.reduce((acc, t) => acc + t.csatRating, 0) / csatRatedTickets.length).toFixed(1) : '4.9';
  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  const combinedViewers = simulatedCollider
    ? [...activeViewers, simulatedCollider]
    : activeViewers.length > 0
    ? activeViewers
    : [{ agentName: user.name }];
  const otherViewers = combinedViewers.filter((v) => v.agentName !== user.name);
  const currentTicketTyper = selectedTicket ? typingAgents[selectedTicket.ticketId] : null;

  const mergeableTickets = selectedTicket
    ? tickets.filter((t) => t._id !== selectedTicket._id && t.status !== 'Closed')
    : [];

  const potentialDuplicates = selectedTicket
    ? mergeableTickets.filter(
        (t) =>
          (t.customerEmail &&
            selectedTicket.customerEmail &&
            t.customerEmail.toLowerCase() === selectedTicket.customerEmail.toLowerCase()) ||
          (t.customerName &&
            selectedTicket.customerName &&
            t.customerName.toLowerCase() === selectedTicket.customerName.toLowerCase())
      )
    : [];

  const leaderboardAgents = useMemo(() => {
    const agentMap = new Map();

    const registerAgent = (name, role = 'Support') => {
      const safeName = (name || '').trim();
      if (!safeName || safeName === 'Unassigned') return;
      const key = safeName.toLowerCase();
      if (!agentMap.has(key)) {
        agentMap.set(key, { name: safeName, role, resolved: 0, xp: 0, badge: '🛡️ Support Agent', avatar: '⭐' });
      }
    };

    if (user.role !== 'Customer') {
      registerAgent(user.name, user.role);
    }

    (agentsList || [])
      .filter((agent) => agent?.role && agent.role !== 'Customer')
      .forEach((agent) => registerAgent(agent.name, agent.role || 'Agent'));

    (usersList || [])
      .filter((member) => member?.role && member.role !== 'Customer')
      .forEach((member) => registerAgent(member.name, member.role || 'Support'));

    (tickets || []).forEach((ticket) => {
      const assignedName = ticket.assignedTo && ticket.assignedTo !== 'Unassigned' ? ticket.assignedTo : null;
      if (!assignedName) return;

      const key = assignedName.toLowerCase();
      if (!agentMap.has(key)) {
        agentMap.set(key, { name: assignedName, role: 'Support', resolved: 0, xp: 0, badge: '🛡️ Support Agent', avatar: '⭐' });
      }

      const agent = agentMap.get(key);
      const isResolved = ['Resolved', 'Closed'].includes(ticket.status);
      if (isResolved) {
        agent.resolved += 1;
      }

      const priorityBonus = ticket.priority === 'Urgent' ? 40 : ticket.priority === 'High' ? 25 : ticket.priority === 'Medium' ? 15 : 10;
      const activityBonus = isResolved ? 150 : 30;
      agent.xp += activityBonus + priorityBonus;
    });

    return Array.from(agentMap.values())
      .map((agent) => {
        const derived = Math.max(agent.resolved * 120, agent.xp);
        const badge =
          agent.resolved >= 10 ? '⚡ Speed Demon' :
          agent.resolved >= 5 ? '⭐ CSAT Master' :
          agent.resolved >= 2 ? '🌱 Rising Star' : '🛡️ Support Agent';
        const avatar =
          agent.resolved >= 10 ? '🚀' :
          agent.resolved >= 5 ? '💎' :
          agent.resolved >= 2 ? '⭐' : '🛡️';

        return {
          ...agent,
          xp: derived,
          badge,
          avatar
        };
      })
      .sort((a, b) => b.xp - a.xp || b.resolved - a.resolved);
  }, [agentsList, tickets, user.name, user.role, usersList]);

  const currentUserLeaderboard = leaderboardAgents.find((agent) => agent.name.toLowerCase() === user.name.toLowerCase()) || { resolved: 0, xp: 0, badge: '🛡️ Support Agent' };
  const currentUserRank = Math.max(1, leaderboardAgents.findIndex((agent) => agent.name.toLowerCase() === user.name.toLowerCase()) + 1);
  const currentUserBadges = currentUserLeaderboard.resolved >= 10 ? 4 : currentUserLeaderboard.resolved >= 5 ? 3 : currentUserLeaderboard.resolved >= 2 ? 2 : currentUserLeaderboard.resolved > 0 ? 1 : 0;

  return (
    <div className={`${darkMode ? 'dark bg-[#0B0D13] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'} h-screen flex flex-col font-sans transition-colors relative overflow-hidden`}>
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white px-4 py-3 rounded-xl shadow-2xl shadow-indigo-500/30 border border-indigo-400/30 font-semibold text-xs flex items-center gap-2.5 animate-bounce">
          <Bell className="w-4 h-4" /> <span>{toastMessage}</span>
        </div>
      )}

      {/* COMMAND PALETTE MODAL (Ctrl + K) - Linear Spotlight Style */}
      {showCommandPalette && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 px-4" onClick={() => setShowCommandPalette(false)}>
          <div className={`w-full max-w-xl rounded-xl border shadow-2xl overflow-hidden ${darkMode ? 'bg-[#12151E] border-white/10 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`} onClick={(e) => e.stopPropagation()}>
            <div className={`p-3.5 border-b flex items-center gap-3 ${darkMode ? 'border-white/[0.07]' : 'border-slate-200'}`}>
              <Command className="w-4 h-4 text-indigo-400" />
              <input
                autoFocus
                type="text"
                placeholder="Type a command or search workspace (Queue, Kanban, Leaderboard, KB, Export)..."
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                className="w-full bg-transparent text-xs focus:outline-none"
              />
              <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${darkMode ? 'bg-[#181C26] border-white/10 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>ESC</span>
            </div>
            <div className="p-2 max-h-72 overflow-y-auto space-y-1 text-xs">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Navigation & Quick Actions</div>
              <div onClick={() => { setActiveTab('queue'); setShowCommandPalette(false); }} className="px-3 py-2 rounded-lg hover:bg-indigo-500/15 hover:text-indigo-300 cursor-pointer flex items-center justify-between transition">
                <span>Go to Ticket Queue</span> <span className="font-mono text-slate-500">Alt+Q</span>
              </div>
              <div onClick={() => { setActiveTab('kanban'); setShowCommandPalette(false); }} className="px-3 py-2 rounded-lg hover:bg-indigo-500/15 hover:text-indigo-300 cursor-pointer flex items-center justify-between transition">
                <span>Go to Kanban Board</span> <span className="font-mono text-slate-500">Alt+B</span>
              </div>
              <div onClick={() => { setActiveTab('leaderboard'); setShowCommandPalette(false); }} className="px-3 py-2 rounded-lg hover:bg-indigo-500/15 hover:text-indigo-300 cursor-pointer flex items-center justify-between transition">
                <span>Go to Agent Leaderboard</span> <span className="font-mono text-slate-500">Alt+T</span>
              </div>
              <div onClick={() => { setActiveTab('kb'); setShowCommandPalette(false); }} className="px-3 py-2 rounded-lg hover:bg-indigo-500/15 hover:text-indigo-300 cursor-pointer flex items-center justify-between transition">
                <span>Go to Knowledge Base</span> <span className="font-mono text-slate-500">Alt+K</span>
              </div>
              <div onClick={() => { exportTicketsToCSV(); setShowCommandPalette(false); }} className="px-3 py-2 rounded-lg hover:bg-emerald-500/15 text-emerald-400 cursor-pointer flex items-center justify-between transition">
                <span>📊 Export Enterprise CSV Report</span> <span className="font-mono text-slate-500">CSV</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LINEAR + ZENDESK TOP NAVIGATION HEADER */}
      <header className={`h-14 shrink-0 border-b px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 backdrop-blur-xl ${darkMode ? 'border-white/[0.07] bg-[#0B0D13]/90' : 'border-slate-200/90 bg-white/95 shadow-2xs'}`}>
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 border border-indigo-400/30 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div className="flex items-center">
              <span className="font-bold tracking-tight text-base">Resolve</span><span className="font-bold tracking-tight text-base text-indigo-500 dark:text-indigo-400">AI</span>
              <span className={`ml-2 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md font-semibold border ${darkMode ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>{user.role}</span>
            </div>
          </div>

          <nav className={`min-w-0 max-w-[46vw] xl:max-w-none flex items-center gap-1 p-1 rounded-xl border overflow-x-auto whitespace-nowrap ${darkMode ? 'bg-[#12151E] border-white/[0.07]' : 'bg-slate-100 border-slate-200/80'}`}>
            <button onClick={() => setActiveTab('queue')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeTab === 'queue' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'}`}>
              <Inbox className="w-3.5 h-3.5 inline mr-1" /> Queue ({tickets.length})
            </button>
            <button onClick={() => setActiveTab('kanban')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeTab === 'kanban' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'}`}>
              <Kanban className="w-3.5 h-3.5 inline mr-1" /> Kanban
            </button>
            <button onClick={() => setActiveTab('leaderboard')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeTab === 'leaderboard' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25' : 'text-amber-500 dark:text-amber-400 hover:bg-amber-500/10'}`}>
              <Trophy className="w-3.5 h-3.5 inline mr-1" /> Leaderboard
            </button>
            <button onClick={() => setActiveTab('analytics')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'}`}>
              <BarChart3 className="w-3.5 h-3.5 inline mr-1" /> Analytics
            </button>
            <button onClick={() => setActiveTab('macros')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeTab === 'macros' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'}`}>
              ⚡ Macros
            </button>
            <button onClick={() => setActiveTab('users')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'}`}>
              <Users className="w-3.5 h-3.5 inline mr-1" /> Users
            </button>
            <button onClick={() => setActiveTab('kb')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeTab === 'kb' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'}`}>
              <BookOpen className="w-3.5 h-3.5 inline mr-1" /> KB
            </button>
            <button onClick={() => setActiveTab('audit')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeTab === 'audit' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'}`}>
              <Activity className="w-3.5 h-3.5 inline mr-1" /> Audit Logs
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setShowCommandPalette(true)} className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 cursor-pointer transition ${darkMode ? 'bg-[#12151E] border-white/8 text-slate-300 hover:border-indigo-500/40' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            <Command className="w-3.5 h-3.5 text-indigo-400" /> <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${darkMode ? 'bg-[#181C26] text-slate-400' : 'bg-slate-100 text-slate-600'}`}>Ctrl+K</span>
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button onClick={() => { setShowNotifDropdown(!showNotifDropdown); if (!showNotifDropdown) markNotificationsAsRead(); }} className={`p-2 rounded-lg border relative cursor-pointer transition ${darkMode ? 'bg-[#12151E] border-white/8 text-slate-300 hover:border-indigo-500/40' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] font-extrabold flex items-center justify-center">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className={`absolute right-0 mt-2 w-80 rounded-xl border shadow-2xl z-50 overflow-hidden ${darkMode ? 'bg-[#12151E] border-white/10' : 'bg-white border-slate-200'}`}>
                <div className={`p-3 border-b text-xs font-bold flex justify-between ${darkMode ? 'border-white/[0.07]' : 'border-slate-200'}`}>
                  <span>Notifications</span>
                  <span className="text-[10px] text-slate-400">{notifications.length} total</span>
                </div>
                <div className={`max-h-72 overflow-y-auto divide-y ${darkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">No notifications yet</div>
                  ) : (
                    notifications.map((n, idx) => (
                      <div key={idx} className={`p-3 text-xs ${!n.read ? (darkMode ? 'bg-indigo-500/5' : 'bg-indigo-50/40') : ''}`}>
                        <p className="font-semibold">{n.title}</p>
                        <p className="text-slate-400 text-[11px] mt-0.5">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button onClick={exportTicketsToCSV} className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${darkMode ? 'bg-[#12151E] border-white/8 text-slate-200 hover:border-emerald-500/40 hover:text-emerald-300' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            <Download className="w-3.5 h-3.5 text-emerald-400" /> Export CSV
          </button>
          <button onClick={() => setDarkMode(!darkMode)} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} className={`p-2 rounded-lg border cursor-pointer transition ${darkMode ? 'bg-[#12151E] border-white/8 text-amber-400 hover:border-white/20' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={onLogout} className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-semibold border border-rose-500/20 cursor-pointer flex items-center gap-1 transition hover:bg-rose-500/20">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </header>

      {/* QUEUE TAB - ZENDESK + LINEAR 3-PANE WORKSPACE */}
      {activeTab === 'queue' && (
        <div className="flex-1 flex flex-col overflow-hidden h-[calc(100vh-3.5rem)]">
          {/* Compact Linear-Style Subheader Bar with Zendesk KPI Pills */}
          <div className="shrink-0 flex flex-wrap items-center justify-between gap-4 px-5 pt-3 pb-2.5">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-sm sm:text-base font-bold tracking-tight flex items-center gap-2">
                  Support Workspace
                  <span className="text-xs font-normal text-slate-500">/ {user.name}</span>
                </h1>
              </div>
              <span className={`hidden sm:inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full border font-medium ${darkMode ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Queue
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              {[
                { label: 'Total Tickets', value: tickets.length, dot: 'bg-indigo-400' },
                { label: 'Needs Attention', value: tickets.filter((ticket) => ['Open', 'In Progress'].includes(ticket.status)).length, dot: 'bg-amber-400' },
                { label: 'Resolved', value: tickets.filter((ticket) => ['Resolved', 'Closed'].includes(ticket.status)).length, dot: 'bg-emerald-400' },
                { label: 'Urgent SLA', value: tickets.filter((ticket) => ticket.priority === 'Urgent' && !['Resolved', 'Closed'].includes(ticket.status)).length, dot: 'bg-rose-500' }
              ].map((stat) => (
                <div key={stat.label} className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs ${darkMode ? 'border-white/[0.07] bg-[#12151E]' : 'border-slate-200/90 bg-white shadow-2xs'}`}>
                  <span className={`h-2 w-2 rounded-full ${stat.dot}`} />
                  <span className="text-slate-400 font-medium">{stat.label}</span>
                  <span className="font-bold font-mono">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Main 3-Pane Zendesk + Linear Workspace */}
          <div className="flex flex-1 min-h-0 gap-3.5 px-5 pb-4">
            {/* Left Pane: Ticket Views & Queue */}
            <div className={`w-84 shrink-0 rounded-xl border overflow-hidden flex flex-col ${darkMode ? 'border-white/[0.07] bg-[#12151E]' : 'border-slate-200/90 bg-white shadow-xs'}`}>
              <div className={`p-3.5 border-b space-y-2.5 ${darkMode ? 'border-white/[0.07]' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Ticket Views</h2>
                    <span className="text-[11px] text-slate-500 font-mono">({filteredTickets.length})</span>
                  </div>
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold border ${darkMode ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                    {tickets.filter((ticket) => ticket.status === 'Open').length} unassigned/new
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Filter by ID, subject, customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full border rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none transition ${darkMode ? 'bg-[#0B0D13] border-white/8 text-white placeholder:text-slate-500 focus:border-indigo-500/60' : 'bg-slate-50 border-slate-200 placeholder:text-slate-400 focus:border-indigo-500'}`}
                  />
                </div>

                {/* Bulk Actions Toolbar */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <button onClick={toggleSelectAll} className="flex items-center gap-1.5 font-medium text-slate-400 hover:text-indigo-400 cursor-pointer transition">
                    {selectedTicketIds.length > 0 && selectedTicketIds.length === filteredTickets.length ? (
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    Select All ({selectedTicketIds.length})
                  </button>
                  {selectedTicketIds.length > 0 && (
                    <div className="flex gap-1.5">
                      <button onClick={() => handleBulkStatusUpdate('Resolved')} className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold text-[10px] cursor-pointer">Resolve</button>
                      <button onClick={() => handleBulkStatusUpdate('Closed')} className="px-2 py-0.5 rounded bg-slate-700/60 text-slate-300 font-semibold text-[10px] cursor-pointer">Close</button>
                    </div>
                  )}
                </div>

                <div className={`flex gap-1 overflow-x-auto p-1 rounded-lg border ${darkMode ? 'bg-[#0B0D13] border-white/5' : 'bg-slate-100 border-slate-200/70'}`}>
                  {['All', 'Open', 'In Progress', 'Resolved'].map((st) => (
                    <button key={st} onClick={() => setFilterStatus(st)} className={`px-2.5 py-1 rounded-md text-[10px] whitespace-nowrap font-semibold cursor-pointer transition ${filterStatus === st ? (darkMode ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-white text-indigo-600 shadow-2xs') : 'text-slate-500 hover:text-slate-300'}`}>
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredTickets.length === 0 ? (
                  <div className="p-10 text-center text-slate-500">
                    <Inbox className="w-8 h-8 mx-auto opacity-40 mb-2" />
                    <p className="text-xs font-medium">No tickets match current view</p>
                  </div>
                ) : (
                  filteredTickets.map((tkt) => {
                    const isChecked = selectedTicketIds.includes(tkt._id);
                    const isSelected = selectedTicket?._id === tkt._id;
                    return (
                      <div
                        key={tkt._id}
                        onClick={() => setSelectedTicket(tkt)}
                        className={`p-3 rounded-lg cursor-pointer transition flex items-start gap-2.5 border ${
                          isSelected
                            ? darkMode
                              ? 'bg-indigo-500/12 border-indigo-500/40 border-l-2 border-l-indigo-400'
                              : 'bg-indigo-50/70 border-indigo-200 border-l-2 border-l-indigo-600'
                            : darkMode
                            ? 'border-transparent hover:bg-white/3 hover:border-white/6'
                            : 'border-transparent hover:bg-slate-50 hover:border-slate-200/80'
                        }`}
                      >
                        <button onClick={(e) => toggleSelectTicket(tkt._id, e)} className="mt-0.5 cursor-pointer">
                          {isChecked ? <CheckSquare className="w-3.5 h-3.5 text-indigo-400" /> : <Square className="w-3.5 h-3.5 text-slate-500" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-mono text-[11px] font-semibold text-indigo-400 truncate">{tkt.ticketId} • {tkt.customerName}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0 ${getSlaBadge(tkt).color}`}>{getSlaBadge(tkt).label}</span>
                          </div>
                          <h4 className={`text-xs font-semibold line-clamp-1 mb-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{tkt.subject}</h4>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className={`px-2 py-0.5 rounded border font-medium ${darkMode ? 'bg-[#0B0D13] border-white/[0.07] text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                              {tkt.department || 'Technical'}
                            </span>
                            <span className={`px-2 py-0.5 rounded border font-semibold ${getStatusPill(tkt.status)}`}>
                              {tkt.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Center Pane: Conversation Thread & Zendesk Composer */}
            {selectedTicket ? (
              <div className={`min-w-0 flex-1 flex flex-col rounded-xl border overflow-hidden ${darkMode ? 'border-white/[0.07] bg-[#12151E]' : 'border-slate-200/90 bg-white shadow-xs'}`}>
                <div className={`p-3.5 border-b flex items-center justify-between gap-3 ${darkMode ? 'border-white/[0.07] bg-[#161A26]/60' : 'border-slate-200 bg-white'}`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded border font-mono text-xs font-semibold ${darkMode ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>{selectedTicket.ticketId}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${getStatusPill(selectedTicket.status)}`}>{selectedTicket.status}</span>
                      <h2 className="text-sm font-bold truncate">{selectedTicket.subject}</h2>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Requester: <strong className={darkMode ? 'text-slate-200' : 'text-slate-700'}>{selectedTicket.customerName}</strong> ({selectedTicket.customerEmail})</p>
                  </div>

                  {/* Live Collision Viewers Badge + Simulator Trigger */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className={`flex items-center gap-2 border px-2.5 py-1.5 rounded-lg text-xs ${otherViewers.length > 0 ? 'bg-amber-500/10 border-amber-500/30' : darkMode ? 'bg-[#0B0D13] border-white/8' : 'bg-slate-50 border-slate-200'}`}>
                      <Eye className={`w-3.5 h-3.5 ${otherViewers.length > 0 ? 'text-amber-400 animate-pulse' : 'text-indigo-400'}`} />
                      <span className="text-slate-400">Agents ({combinedViewers.length}):</span>
                      <div className="flex items-center gap-1">
                        {combinedViewers.map((v, i) => (
                          <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-[11px] ${darkMode ? 'bg-[#181C26] text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            {v.agentName}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={toggleSimulateCollision}
                      title="Simulate another agent viewing/typing on this ticket"
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition ${
                        simulatedCollider ? 'bg-amber-400 text-slate-950 border-amber-300' : darkMode ? 'bg-[#0B0D13] border-white/8 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <Radio className="w-3.5 h-3.5 inline mr-1" />
                      {simulatedCollider ? 'Stop Sim' : 'Test Collision'}
                    </button>

                    <button onClick={() => api.delete(`/tickets/${selectedTicket._id}`)} className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 cursor-pointer hover:bg-rose-500/20 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* LIVE COLLISION DETECTION WARNING BANNER */}
                {(otherViewers.length > 0 || currentTicketTyper) && (
                  <div className="bg-amber-500/10 border-b border-amber-500/30 px-5 py-2 flex items-center justify-between text-xs text-amber-300">
                    <div className="flex items-center gap-2 font-semibold">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
                      <span>
                        Collision Guard Active:{' '}
                        {currentTicketTyper
                          ? `✍️ ${currentTicketTyper} is currently typing a reply on this ticket! Coordinate before sending.`
                          : `👁 ${otherViewers.map((v) => v.agentName).join(', ')} is also viewing this ticket in real-time.`}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                      LIVE SYNC
                    </span>
                  </div>
                )}

                {/* AUTOMATIC DUPLICATE TICKET DETECTION BANNER */}
                {potentialDuplicates.length > 0 && (
                  <div className="bg-violet-500/10 border-b border-violet-500/30 px-5 py-2 flex items-center justify-between text-xs text-violet-300">
                    <div className="flex items-center gap-2">
                      <GitMerge className="w-4 h-4 text-violet-400 shrink-0" />
                      <span>
                        <strong>Duplicate Detected:</strong> {selectedTicket.customerName} also has active ticket{' '}
                        <span className="font-mono font-bold underline">{potentialDuplicates[0].ticketId}</span> ("{potentialDuplicates[0].subject}").
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={isMerging}
                      onClick={() => handleMergeTickets(potentialDuplicates[0]._id)}
                      className="px-3 py-1 rounded-md bg-indigo-600 text-white font-semibold text-[11px] cursor-pointer hover:bg-indigo-500 transition shrink-0"
                    >
                      {isMerging ? 'Merging...' : `🔀 Quick Merge ${potentialDuplicates[0].ticketId}`}
                    </button>
                  </div>
                )}

                {/* Linear AI Copilot & Summarizer Banner */}
                <div className={`border-b px-5 py-2 flex items-center justify-between gap-4 text-xs ${darkMode ? 'bg-indigo-500/[0.07] border-white/[0.07]' : 'bg-indigo-50/70 border-indigo-100'}`}>
                  <div className="flex items-center gap-2 flex-1">
                    <Sparkles className="w-4 h-4 shrink-0 text-indigo-400" />
                    <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                      <strong className={darkMode ? 'text-indigo-300' : 'text-indigo-700'}>AI Copilot ({selectedTicket.aiConfidenceScore || 94}%):</strong>{' '}
                      {customAiSummary[selectedTicket._id] || selectedTicket.aiSummary || 'Click Summarize Thread to generate an instant AI summary.'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSummarizeThread}
                    disabled={aiSummarizing}
                    className={`px-3 py-1 rounded-md border font-semibold text-[11px] shrink-0 cursor-pointer transition ${darkMode ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/25' : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'}`}
                  >
                    <Bot className="w-3.5 h-3.5 inline mr-1" />
                    {aiSummarizing ? 'Summarizing...' : '✨ Summarize Thread'}
                  </button>
                </div>

                {selectedTicket.csatRating && (
                  <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-2 text-xs font-semibold text-amber-400 flex items-center gap-2">
                    <Star className="w-4 h-4 fill-current" /> Customer CSAT Rating: {selectedTicket.csatRating}/5 ⭐ {selectedTicket.csatFeedback && `("${selectedTicket.csatFeedback}")`}
                  </div>
                )}

                {/* Chat Messages Area with Feature #12 Auto-Translate */}
                <div className={`flex-1 overflow-y-auto p-5 space-y-4 ${darkMode ? 'bg-[#0B0D13]/60' : 'bg-slate-50/60'}`}>
                  {(selectedTicket.messages || []).map((m, i) => {
                    const translatedText = translatedMessages[i];
                    return (
                      <div key={i} className={`flex flex-col ${m.senderRole === 'Customer' ? 'items-start' : 'items-end'}`}>
                        <div className={`max-w-2xl rounded-xl p-4 border relative group ${
                          m.isInternalNote
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-100'
                            : m.senderRole === 'Customer'
                            ? darkMode
                              ? 'bg-[#161A26] border-white/8 text-slate-100'
                              : 'bg-white border-slate-200 text-slate-900 shadow-2xs'
                            : darkMode
                            ? 'bg-indigo-600/20 border-indigo-500/35 text-slate-100'
                            : 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                        }`}>
                          <div className="flex items-center justify-between gap-6 mb-1.5 text-[11px]">
                            <span className="font-semibold flex items-center gap-1.5">
                              {m.isInternalNote && <Lock className="w-3 h-3 text-amber-400" />}
                              {m.senderName} <span className="opacity-65">({m.senderRole})</span>
                            </span>
                            <div className="flex items-center gap-2">
                              {m.senderRole === 'Customer' && (
                                <button
                                  type="button"
                                  onClick={() => handleTranslateMessage(i, m.text)}
                                  className={`text-[10px] px-2 py-0.5 rounded border font-medium transition cursor-pointer flex items-center gap-1 ${darkMode ? 'bg-[#0B0D13] border-white/10 text-indigo-300 hover:border-indigo-500/40' : 'bg-slate-100 border-slate-200 text-indigo-700'}`}
                                >
                                  <Globe className="w-3 h-3" /> {translatedText ? 'Show Original' : 'Translate'}
                                </button>
                              )}
                              <span className="opacity-60 font-mono text-[10px]">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>

                          <p className="text-xs leading-relaxed whitespace-pre-line">{translatedText || m.text}</p>

                          {m.attachmentUrl && (
                            <div className="mt-2.5">
                              {m.attachmentUrl.startsWith('data:audio') ? (
                                <div className="p-2 rounded-lg bg-[#0B0D13] border border-white/10 flex items-center gap-2">
                                  <Mic className="w-4 h-4 text-indigo-400 shrink-0" />
                                  <audio controls src={m.attachmentUrl} className="h-8 w-60" />
                                </div>
                              ) : (
                                <img src={m.attachmentUrl} alt="attachment" className="max-h-40 rounded-lg border border-black/20 object-cover" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Zendesk-Style Composer Box */}
                <div className={`p-3.5 border-t ${darkMode ? 'border-white/[0.07] bg-[#12151E]' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => setIsInternalNote(false)} className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${!isInternalNote ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}>
                        Public Reply
                      </button>
                      <button type="button" onClick={() => setIsInternalNote(true)} className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${isInternalNote ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}>
                        Internal Note (@mentions)
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        onChange={(e) => {
                          const m = macrosList.find((mac) => mac.title === e.target.value);
                          if (m) handleReplyTyping(m.content);
                        }}
                        defaultValue=""
                        className={`border rounded-lg px-2.5 py-1 text-xs ${darkMode ? 'bg-[#0B0D13] border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200'}`}
                      >
                        <option value="" disabled>⚡ Apply Macro...</option>
                        {macrosList.map((m, idx) => <option key={idx} value={m.title}>{m.title}</option>)}
                      </select>
                      <button type="button" onClick={handleGenerateAIDraft} disabled={aiGenerating} className="px-3 py-1 rounded-lg bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs cursor-pointer shadow-sm shadow-indigo-500/20 transition">
                        <Sparkles className="w-3.5 h-3.5 inline mr-1" /> {aiGenerating ? 'Drafting...' : 'AI Smart Reply'}
                      </button>
                    </div>
                  </div>

                  {chatAttachment && (
                    <div className="mb-2 flex items-center gap-3 bg-[#0B0D13] border border-white/10 p-2 rounded-lg text-xs">
                      {chatAttachment.startsWith('data:audio') ? (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-indigo-400">🎙️ Voice Note Ready:</span>
                          <audio controls src={chatAttachment} className="h-7 w-52" />
                        </div>
                      ) : (
                        <span className="truncate max-w-xs">📎 Image Attachment loaded</span>
                      )}
                      <button onClick={() => setChatAttachment('')} className="text-rose-400 font-semibold ml-auto cursor-pointer">Remove</button>
                    </div>
                  )}

                  <div className="flex gap-2 items-center">
                    <label title="Attach Image" className={`p-2.5 rounded-lg border cursor-pointer transition ${darkMode ? 'border-white/10 bg-[#0B0D13] text-slate-400 hover:text-white hover:border-indigo-500/40' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                      <Paperclip className="w-4 h-4" />
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>

                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startVoiceRecording}
                        title="Record Voice Note"
                        className={`p-2.5 rounded-lg border cursor-pointer transition ${darkMode ? 'border-white/10 bg-[#0B0D13] text-slate-400 hover:text-indigo-400 hover:border-indigo-500/40' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopVoiceRecording}
                        title="Stop Recording"
                        className="px-3 py-2.5 rounded-lg border border-rose-500/50 bg-rose-500/20 text-rose-400 font-mono text-xs font-bold cursor-pointer flex items-center gap-1.5 animate-pulse"
                      >
                        <StopIcon className="w-3.5 h-3.5 fill-current" />
                        00:{String(recordingSeconds).padStart(2, '0')}
                      </button>
                    )}

                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={(e) => handleReplyTyping(e.target.value)}
                      placeholder={isInternalNote ? '🔒 Internal note (supports @mentions)...' : 'Write a public reply or record a voice note...'}
                      className={`flex-1 rounded-lg p-2.5 text-xs focus:outline-none border transition ${isInternalNote ? 'bg-amber-950/20 border-amber-500/40 text-amber-100' : darkMode ? 'bg-[#0B0D13] border-white/10 text-white focus:border-indigo-500/60' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'}`}
                    />
                    <div className="flex flex-col gap-1">
                      {!isInternalNote && selectedTicket.status !== 'Resolved' && (
                        <button type="button" onClick={() => handleSendMessage('Resolved')} className="px-3 py-1 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold cursor-pointer hover:bg-emerald-500/25">
                          Submit as Solved
                        </button>
                      )}
                      <button type="button" onClick={() => handleSendMessage(null)} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-500/25 transition">
                        <Send className="w-3.5 h-3.5" /> Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`min-w-0 flex-1 flex flex-col items-center justify-center rounded-xl border text-slate-500 text-sm ${darkMode ? 'border-white/[0.07] bg-[#12151E]' : 'border-slate-200 bg-white'}`}>
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"><Inbox className="h-5 w-5" /></span>
                <span className="font-semibold text-slate-300">No ticket selected</span>
                <span className="mt-1 text-xs text-slate-500">Choose a ticket from the left queue to inspect the thread.</span>
              </div>
            )}

            {/* Right Pane: Zendesk Properties & Ticket Inspector */}
            {selectedTicket && (
              <div className={`w-68 shrink-0 rounded-xl border p-4 space-y-5 overflow-y-auto ${darkMode ? 'border-white/[0.07] bg-[#12151E]' : 'border-slate-200/90 bg-white shadow-xs'}`}>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-indigo-400">Inspector</p>
                  <h3 className="text-xs font-bold mt-0.5">Ticket Properties</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Ticket Status</label>
                    <select value={selectedTicket.status} onChange={(e) => handleUpdateField('status', e.target.value)} className={`w-full border rounded-lg px-3 py-2 text-xs font-semibold ${darkMode ? 'bg-[#0B0D13] border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`}>
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Department Routing</label>
                    <select value={selectedTicket.department || 'Technical Support'} onChange={(e) => handleUpdateField('department', e.target.value)} className={`w-full border rounded-lg px-3 py-2 text-xs font-semibold ${darkMode ? 'bg-[#0B0D13] border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`}>
                      <option value="Technical Support">Technical Support</option>
                      <option value="Billing Dept">Billing Dept</option>
                      <option value="Security & Access">Security & Access</option>
                      <option value="General Inquiries">General Inquiries</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Assignee</label>
                    <select value={selectedTicket.assignedTo} onChange={(e) => handleUpdateField('assignedTo', e.target.value)} className={`w-full border rounded-lg px-3 py-2 text-xs font-semibold ${darkMode ? 'bg-[#0B0D13] border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`}>
                      <option value="Unassigned">Unassigned</option>
                      {agentsList.map((ag) => (
                        <option key={ag._id} value={ag.name}>{ag.name} ({ag.role})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Priority Level</label>
                    <select value={selectedTicket.priority} onChange={(e) => handleUpdateField('priority', e.target.value)} className={`w-full border rounded-lg px-3 py-2 text-xs font-semibold ${darkMode ? 'bg-[#0B0D13] border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`}>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Ticket Merge Box */}
                <div className={`pt-4 border-t space-y-2.5 ${darkMode ? 'border-white/[0.07]' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <GitMerge className="w-3.5 h-3.5" /> Merge Duplicate
                    </h4>
                    {potentialDuplicates.length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
                        {potentialDuplicates.length} match
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Consolidate another ticket&apos;s messages into <strong className="text-slate-200">{selectedTicket.ticketId}</strong> and close the duplicate.
                  </p>
                  <select
                    value={mergeTargetId}
                    onChange={(e) => setMergeTargetId(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-xs ${darkMode ? 'bg-[#0B0D13] border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <option value="">Select ticket to merge...</option>
                    {mergeableTickets.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.ticketId} — {t.subject.slice(0, 26)} ({t.customerName})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!mergeTargetId || isMerging}
                    onClick={() => handleMergeTickets()}
                    className="w-full py-2 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 disabled:opacity-40 text-indigo-300 border border-indigo-500/30 font-semibold text-xs cursor-pointer transition flex items-center justify-center gap-1.5"
                  >
                    <GitMerge className="w-3.5 h-3.5" />
                    {isMerging ? 'Merging Tickets...' : 'Merge into Current Ticket'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* KANBAN BOARD TAB */}
      {activeTab === 'kanban' && (
        <div className="flex-1 overflow-x-auto p-6 flex gap-5 max-w-7xl mx-auto w-full">
          {['Open', 'In Progress', 'Resolved', 'Closed'].map((colStatus) => {
            const colTickets = tickets.filter((t) => t.status === colStatus);
            return (
              <div
                key={colStatus}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleKanbanDrop(colStatus)}
                className={`w-80 shrink-0 border rounded-xl flex flex-col overflow-hidden ${darkMode ? 'bg-[#12151E] border-white/[0.07]' : 'bg-white border-slate-200'}`}
              >
                <div className={`p-3.5 border-b flex items-center justify-between font-bold text-xs ${darkMode ? 'border-white/[0.07]' : 'border-slate-200'}`}>
                  <span className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded border text-[10px] ${getStatusPill(colStatus)}`}>{colStatus}</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-md font-mono text-[11px] border ${darkMode ? 'bg-[#0B0D13] border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>{colTickets.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                  {colTickets.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">Drop ticket here</div>
                  ) : (
                    colTickets.map((tkt) => (
                      <div
                        key={tkt._id}
                        draggable
                        onDragStart={() => setDraggedTicketId(tkt._id)}
                        onClick={() => { setSelectedTicket(tkt); setActiveTab('queue'); }}
                        className={`border rounded-lg p-3.5 space-y-2 cursor-grab active:cursor-grabbing transition ${darkMode ? 'bg-[#0B0D13] border-white/8 hover:border-indigo-500/50' : 'bg-slate-50 border-slate-200 hover:border-indigo-400'}`}
                      >
                        <div className="flex justify-between items-center text-[10px] font-mono text-indigo-400">
                          <span>{tkt.ticketId}</span>
                          <span className={`px-2 py-0.5 rounded border ${getSlaBadge(tkt).color}`}>{getSlaBadge(tkt).label}</span>
                        </div>
                        <h4 className="text-xs font-semibold line-clamp-2">{tkt.subject}</h4>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                          <span>{tkt.customerName}</span>
                          <select
                            value={tkt.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleUpdateField('status', e.target.value, tkt._id);
                            }}
                            className="bg-[#161A26] border border-white/10 text-white rounded px-1.5 py-0.5 text-[10px] cursor-pointer"
                          >
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ✅ FEATURE #11 TAB VIEW: AGENT GAMIFICATION & LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" /> Agent Gamification & Leaderboard
              </h2>
              <p className="text-xs text-slate-400 mt-1">Real-time team performance metrics, XP rankings, and elite support badges.</p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 font-semibold text-xs border border-amber-500/25">
              Season 2026 Active 🏆
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className={`border p-5 rounded-xl ${darkMode ? 'bg-[#12151E] border-white/[0.07]' : 'bg-white border-slate-200'}`}>
              <span className="text-xs font-medium text-slate-400">Your Rank</span>
              <p className="text-3xl font-extrabold text-amber-400 mt-1">#{currentUserRank} {currentUserRank === 1 ? 'Top Agent 👑' : currentUserRank <= 3 ? 'Top 3 Agent' : 'Support Tier'}</p>
            </div>
            <div className={`border p-5 rounded-xl ${darkMode ? 'bg-[#12151E] border-white/[0.07]' : 'bg-white border-slate-200'}`}>
              <span className="text-xs font-medium text-slate-400">Total XP Earned</span>
              <p className="text-3xl font-extrabold text-indigo-400 mt-1">{currentUserLeaderboard.xp.toLocaleString()} XP</p>
            </div>
            <div className={`border p-5 rounded-xl ${darkMode ? 'bg-[#12151E] border-white/[0.07]' : 'bg-white border-slate-200'}`}>
              <span className="text-xs font-medium text-slate-400">Active Badges</span>
              <p className="text-3xl font-extrabold text-violet-400 mt-1">{currentUserBadges} Badges {currentUserBadges > 0 ? '🛡️' : '✨'}</p>
            </div>
          </div>

          <div className={`border rounded-xl overflow-hidden ${darkMode ? 'bg-[#12151E] border-white/[0.07]' : 'bg-white border-slate-200'}`}>
            <div className={`p-4 border-b font-bold text-xs flex items-center justify-between ${darkMode ? 'border-white/[0.07]' : 'border-slate-200'}`}>
              <span>Support Team Rankings</span>
              <span className="text-slate-400 text-[11px]">Ranked by XP & Resolution Speed</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-white/[0.07] text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                  <th className="p-3.5">Rank</th>
                  <th className="p-3.5">Agent Name</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Resolved Count</th>
                  <th className="p-3.5">XP Score</th>
                  <th className="p-3.5">Badge Title</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                {leaderboardAgents.map((ag, idx) => (
                  <tr key={idx} className={`transition ${idx === 0 ? (darkMode ? 'bg-indigo-500/10' : 'bg-indigo-50/60') : 'hover:bg-white/2'}`}>
                    <td className="p-3.5 font-bold font-mono text-amber-400">#{idx + 1} {ag.avatar}</td>
                    <td className="p-3.5 font-semibold flex items-center gap-2">
                      {ag.name} {ag.name.toLowerCase() === user.name.toLowerCase() && <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-600 text-white font-bold">You</span>}
                    </td>
                    <td className="p-3.5 text-slate-400">{ag.role}</td>
                    <td className="p-3.5 font-semibold text-emerald-400">{ag.resolved} tickets</td>
                    <td className="p-3.5 font-bold font-mono text-indigo-300">{ag.xp} XP</td>
                    <td className="p-3.5 font-medium text-violet-300">{ag.badge}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-4 gap-4">
            <div className={`border p-5 rounded-xl ${darkMode ? 'bg-[#12151E] border-white/[0.07]' : 'bg-white border-slate-200'}`}>
              <span className="text-xs font-medium text-slate-400">Average CSAT Rating</span>
              <p className="text-3xl font-extrabold text-amber-400 mt-1">{avgCsat} / 5.0 ⭐</p>
            </div>
            <div className={`border p-5 rounded-xl ${darkMode ? 'bg-[#12151E] border-white/[0.07]' : 'bg-white border-slate-200'}`}>
              <span className="text-xs font-medium text-slate-400">Resolved</span>
              <p className="text-3xl font-extrabold text-emerald-400 mt-1">{tickets.filter((t) => t.status === 'Resolved').length}</p>
            </div>
            <div className={`border p-5 rounded-xl ${darkMode ? 'bg-[#12151E] border-white/[0.07]' : 'bg-white border-slate-200'}`}>
              <span className="text-xs font-medium text-slate-400">Total Volume</span>
              <p className="text-3xl font-extrabold mt-1">{tickets.length}</p>
            </div>
            <div className={`border p-5 rounded-xl ${darkMode ? 'bg-[#12151E] border-white/[0.07]' : 'bg-white border-slate-200'}`}>
              <span className="text-xs font-medium text-slate-400">SLA Breaches</span>
              <p className="text-3xl font-extrabold text-rose-500 mt-1">{tickets.filter((t) => getSlaBadge(t).label === 'BREACHED').length}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className={`border p-5 rounded-xl h-80 flex flex-col ${darkMode ? 'bg-[#12151E] border-white/[0.07]' : 'bg-white border-slate-200'}`}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Tickets by Category</h3>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={`border p-5 rounded-xl h-80 flex flex-col ${darkMode ? 'bg-[#12151E] border-white/[0.07]' : 'bg-white border-slate-200'}`}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Sentiment Breakdown</h3>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sentimentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label>
                      {sentimentData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MACROS TAB */}
      {activeTab === 'macros' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
          <div className={`border rounded-xl p-6 ${darkMode ? 'bg-[#12151E] border-white/[0.07]' : 'bg-white border-slate-200'}`}>
            <h3 className="text-sm font-bold mb-4">Create Quick Macro</h3>
            <form onSubmit={async (e) => { e.preventDefault(); await api.post('/macros', newMacro); setNewMacro({ title: '', category: 'General', content: '' }); alert('Saved!'); }} className="space-y-3">
              <input required value={newMacro.title} onChange={(e) => setNewMacro({ ...newMacro, title: e.target.value })} placeholder="Macro Title" className={`w-full border rounded-lg px-3 py-2 text-xs ${darkMode ? 'bg-[#0B0D13] border-white/10 text-white' : 'bg-slate-50 border-slate-300'}`} />
              <textarea required rows={3} value={newMacro.content} onChange={(e) => setNewMacro({ ...newMacro, content: e.target.value })} placeholder="Macro response template..." className={`w-full border rounded-lg p-3 text-xs ${darkMode ? 'bg-[#0B0D13] border-white/10 text-white' : 'bg-slate-50 border-slate-300'}`} />
              <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg cursor-pointer transition">Save Macro</button>
            </form>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
          <div className={`border rounded-xl overflow-hidden ${darkMode ? 'bg-[#12151E] border-white/[0.07]' : 'bg-white border-slate-200'}`}>
            <div className={`p-4 border-b font-bold text-xs ${darkMode ? 'border-white/[0.07]' : 'border-slate-200'}`}>Registered Users ({usersList.length})</div>
            <table className="w-full text-left text-xs">
              <thead><tr className={`border-b ${darkMode ? 'border-white/[0.07] text-slate-400' : 'border-slate-200'}`}><th className="p-3.5">Name</th><th className="p-3.5">Email</th><th className="p-3.5">Role</th></tr></thead>
              <tbody className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-slate-100'}`}>{usersList.map((u) => <tr key={u._id}><td className="p-3.5 font-medium">{u.name}</td><td className="p-3.5 text-slate-400">{u.email}</td><td className="p-3.5"><span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${darkMode ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>{u.role}</span></td></tr>)}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* KB TAB */}
      {activeTab === 'kb' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" /> Self-Service Knowledge Base
              </h2>
              <p className="text-xs text-slate-400 mt-1">Search official support articles, FAQs, and troubleshooting documentation.</p>
            </div>
            <div className="relative w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Search articles..."
                value={kbSearch}
                onChange={(e) => setKbSearch(e.target.value)}
                className={`w-full border rounded-lg pl-10 pr-3 py-2 text-xs focus:outline-none ${darkMode ? 'bg-[#12151E] border-white/10 text-white' : 'bg-white border-slate-200'}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {filteredKb.map((art) => (
              <div key={art.id} className={`border rounded-xl p-5 space-y-3 ${darkMode ? 'bg-[#12151E] border-white/[0.07]' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] px-2.5 py-0.5 rounded border font-semibold ${darkMode ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>{art.category}</span>
                  <span className="text-[10px] text-slate-500 font-mono">👁 {art.views} views</span>
                </div>
                <h3 className="text-sm font-bold">{art.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{art.content}</p>
                <button
                  onClick={() => {
                    handleReplyTyping(`Hi, please refer to our Knowledge Base guide on "${art.title}": ${art.content}`);
                    setActiveTab('queue');
                    setToastMessage('📋 Article copied to reply box!');
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs cursor-pointer transition"
                >
                  Insert into Reply ➔
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AUDIT LOGS TAB */}
      {activeTab === 'audit' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" /> Admin Audit Logs & Activity Timeline
              </h2>
              <p className="text-xs text-slate-400 mt-1">Real-time immutable audit trail tracking all agent actions, ticket updates, and security events.</p>
            </div>
            <span className={`px-3 py-1 rounded-lg border font-mono text-xs ${darkMode ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>
              {auditLogs.length} Log Entries
            </span>
          </div>

          <div className={`border rounded-xl overflow-hidden ${darkMode ? 'bg-[#12151E] border-white/[0.07]' : 'bg-white border-slate-200'}`}>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-white/[0.07] text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Action Event</th>
                  <th className="p-3.5">Performed By</th>
                  <th className="p-3.5">Details</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-indigo-500/5 transition">
                    <td className="p-3.5 font-mono text-slate-500 text-[11px]">{log.timestamp}</td>
                    <td className="p-3.5 font-mono font-bold text-indigo-400">{log.action}</td>
                    <td className="p-3.5 font-semibold">{log.performedBy}</td>
                    <td className="p-3.5 text-slate-300">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}