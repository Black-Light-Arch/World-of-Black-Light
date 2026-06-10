import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Auth } from '../services/auth';
import { getSocket } from '../services/socket';
import { Paperclip, Send, X, Shield, Users, User, ArrowLeft, VolumeX, MessageSquare, Trash2, Settings, UserPlus, Check, HelpCircle, Menu, Home, Bot } from 'lucide-react';
import './Chat.css';

const Chat = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(Auth.getSession());
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeSideTab, setActiveSideTab] = useState('all'); // all, group, private, friends
  const [messageInput, setMessageInput] = useState('');
  
  // Presence and typing states
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({}); // roomName -> username
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendSearch, setFriendSearch] = useState('');

  // Group membership states
  const [groupMembers, setGroupMembers] = useState([]);
  const [pendingJoinRequests, setPendingJoinRequests] = useState([]);

  // File sharing state
  const [selectedFile, setSelectedFile] = useState(null); // { name, type, size, data }
  const fileInputRef = useRef(null);

  // Modals state
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupPrivacy, setNewGroupPrivacy] = useState('public');
  
  const [showNewPrivateModal, setShowNewPrivateModal] = useState(false);
  const [newPmUsername, setNewPmUsername] = useState('');
  
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [addFriendUsername, setAddFriendUsername] = useState('');

  const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
  const [joinGroupName, setJoinGroupName] = useState('');

  // Admin Spy Sidebar panel state
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminActiveTab, setAdminActiveTab] = useState('online'); // online, users, rooms, deleted, spy, creds
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminDeletedMsgs, setAdminDeletedMsgs] = useState([]);
  const [adminSpyMessages, setAdminSpyMessages] = useState([]);
  const [adminNewUsername, setAdminNewUsername] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminCredMsg, setAdminCredMsg] = useState({ text: '', type: '' });

  // Responsive device states
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1200);
  const [mobileActiveView, setMobileActiveView] = useState('chats'); // chats, groups, chat_window
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [showScrollFab, setShowScrollFab] = useState(false);

  // Ref helpers
  const messagesEndRef = useRef(null);
  const messagesAreaRef = useRef(null);
  const aiHistoryRef = useRef([]); // holds assistant history { role, content }
  const socketRef = useRef(null);

  const token = Auth.getToken();

  // Voice Chat States
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [roboticFilter, setRoboticFilter] = useState(true);

  // Voice Refs
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const analyserNodeRef = useRef(null);
  const filterNodeRef = useRef(null);
  const delayNodeRef = useRef(null);
  const feedbackGainNodeRef = useRef(null);
  const outputGainNodeRef = useRef(null);
  const voiceCanvasRef = useRef(null);
  const visualizerFrameId = useRef(null);

  const reconnectAudioNodes = (audioCtx, source, filter, delay, feedback, outputGain, analyser, useRobot, isMuted) => {
    try {
      source.disconnect();
      filter.disconnect();
      delay.disconnect();
      feedback.disconnect();
      outputGain.disconnect();
      analyser.disconnect();

      outputGain.gain.value = isMuted ? 0 : 1.0;
      source.connect(analyser);

      if (useRobot) {
        source.connect(filter);
        filter.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        filter.connect(outputGain);
        delay.connect(outputGain);
      } else {
        source.connect(outputGain);
      }

      outputGain.connect(audioCtx.destination);
    } catch (e) {
      console.error('Audio reconnection error:', e);
    }
  };

  const startVoiceChat = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserNodeRef.current = analyser;

      const filter = audioContext.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1000;
      filterNodeRef.current = filter;

      const delay = audioContext.createDelay();
      delay.delayTime.value = 0.02;
      delayNodeRef.current = delay;

      const feedback = audioContext.createGain();
      feedback.gain.value = 0.6;
      feedbackGainNodeRef.current = feedback;

      const outputGain = audioContext.createGain();
      outputGain.gain.value = 1.0;
      outputGainNodeRef.current = outputGain;

      reconnectAudioNodes(audioContext, source, filter, delay, feedback, outputGain, analyser, roboticFilter, voiceMuted);

      setVoiceActive(true);
      setVoiceMuted(false);
    } catch (err) {
      console.error('Failed to access microphone:', err);
      alert('❌ Microphone Access Denied: Unable to establish cyber vocoder connection.');
    }
  };

  const stopVoiceChat = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setVoiceActive(false);
    setVoiceMuted(false);
  };

  useEffect(() => {
    if (voiceActive && audioContextRef.current && sourceNodeRef.current) {
      reconnectAudioNodes(
        audioContextRef.current,
        sourceNodeRef.current,
        filterNodeRef.current,
        delayNodeRef.current,
        feedbackGainNodeRef.current,
        outputGainNodeRef.current,
        analyserNodeRef.current,
        roboticFilter,
        voiceMuted
      );
    }
  }, [roboticFilter, voiceMuted, voiceActive]);

  useEffect(() => {
    if (voiceActive && analyserNodeRef.current && voiceCanvasRef.current) {
      const canvas = voiceCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const analyser = analyserNodeRef.current;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        if (!analyserNodeRef.current) return;
        visualizerFrameId.current = requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(dataArray);

        ctx.fillStyle = 'rgba(13, 13, 26, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#00e5ff';
        ctx.beginPath();

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * canvas.height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      };

      draw();
    }

    return () => {
      if (visualizerFrameId.current) {
        cancelAnimationFrame(visualizerFrameId.current);
      }
    };
  }, [voiceActive]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleMessagesScroll = () => {
    if (!messagesAreaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesAreaRef.current;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 300;
    setShowScrollFab(isScrolledUp);
  };

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;
    
    if (Math.abs(diffX) > 80 && Math.abs(diffY) < 50) {
      if (diffX > 0) {
        if (showRightSidebar) {
          setShowRightSidebar(false);
        } else if (isMobile && mobileActiveView === 'chat_window') {
          setMobileActiveView('chats');
        } else if (isTablet && !showLeftSidebar) {
          setShowLeftSidebar(true);
        }
      } else {
        if (isTablet && showLeftSidebar) {
          setShowLeftSidebar(false);
        } else if (currentRoom?.type === 'group' && (isMobile || isTablet) && !showRightSidebar) {
          setShowRightSidebar(true);
        }
      }
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1200);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  // Load Rooms list
  const loadRooms = async (activeUser) => {
    try {
      const res = await fetch('/api/rooms', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      let data = await res.json();
      
      // Inject AI room synthetically
      const aiRoom = { 
        name: `ai:${activeUser.username}`, 
        type: 'ai', 
        displayName: 'BlackLight AI', 
        icon: '🤖', 
        _synthetic: true 
      };
      
      const combined = [aiRoom, ...data.filter(r => r.name !== aiRoom.name)];
      setRooms(combined);

      // Open AI room by default if nothing selected
      if (!currentRoom) {
        setCurrentRoom(aiRoom);
        // Load AI instructions
        setMessages([]);
        aiHistoryRef.current = [];
      }
    } catch (err) {
      console.error('Failed to load rooms');
    }
  };

  // Load Friends & Requests
  const loadFriendsAndRequests = async () => {
    try {
      const fr = await fetch('/api/friends', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (fr.ok) {
        const data = await fr.json();
        setFriends(data);
      }

      const req = await fetch('/api/friends/requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (req.ok) {
        const data = await req.json();
        setFriendRequests(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load Group Details
  const loadGroupDetails = async (roomName) => {
    try {
      // Members list
      const resMembers = await fetch(`/api/rooms/${encodeURIComponent(roomName)}/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resMembers.ok) {
        const data = await resMembers.json();
        setGroupMembers(data);
      }

      // Join requests if owner
      const resRequests = await fetch(`/api/rooms/${encodeURIComponent(roomName)}/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resRequests.ok) {
        const data = await resRequests.json();
        setPendingJoinRequests(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load Room Message History
  const loadRoomMessages = async (room) => {
    if (room.type === 'ai') {
      setMessages([]);
      return;
    }
    try {
      const res = await fetch(`/api/messages/${encodeURIComponent(room.name)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Load Admin Data on Demand
  const loadAdminUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminUsers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadAdminDeletedMessages = async () => {
    try {
      const res = await fetch('/api/admin/messages/deleted', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminDeletedMsgs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // On mount initialization
  useEffect(() => {
    if (!Auth.isLoggedIn()) {
      navigate('/login');
      return;
    }

    const activeUser = Auth.getSession();
    setSession(activeUser);
    
    loadRooms(activeUser);
    loadFriendsAndRequests();

    // Socket.io Setup
    const socket = getSocket();
    if (socket) {
      socketRef.current = socket;
      socket.emit('authenticate', { token: Auth.getToken() });

      // Socket Listeners
      socket.on('online_users', (users) => {
        setOnlineUsers(users);
      });

      socket.on('new_message', (msg) => {
        // Append message to active room if matching
        setCurrentRoom((prevRoom) => {
          if (prevRoom && prevRoom.name === msg.room) {
            setMessages((prevMsgs) => {
              // Avoid duplicates
              if (prevMsgs.find(m => m._id === msg._id)) return prevMsgs;
              return [...prevMsgs, msg];
            });
            
            // Mark read
            socket.emit('join_room', { room: prevRoom.name });
          } else {
            // Trigger unread notification badge
            setRooms((prevRooms) => 
              prevRooms.map(r => r.name === msg.room ? { ...r, _unread: (r._unread || 0) + 1, lastSender: msg.sender, lastContent: msg.content } : r)
            );
          }
          return prevRoom;
        });

        // Update previews in room list
        setRooms((prevRooms) => 
          prevRooms.map(r => r.name === msg.room ? { ...r, lastSender: msg.sender, lastContent: msg.content } : r)
        );
      });

      socket.on('message_deleted', ({ messageId, deletedBy, room, originalContent }) => {
        setMessages((prevMsgs) => 
          prevMsgs.map(m => m._id === messageId ? { ...m, deleted: true, deletedBy, originalContent, content: '[deleted]' } : m)
        );
      });

      socket.on('user_typing', ({ username, room }) => {
        setTypingUsers((prev) => ({
          ...prev,
          [room]: username
        }));
        // Auto clear typing status after 2 seconds
        setTimeout(() => {
          setTypingUsers((prev) => {
            const next = { ...prev };
            if (next[room] === username) {
              delete next[room];
            }
            return next;
          });
        }, 2000);
      });

      socket.on('friend_request', ({ from }) => {
        loadFriendsAndRequests();
        alert(`👥 Friend Request: ${from} sent you a request.`);
      });

      socket.on('friend_accepted', ({ from }) => {
        loadFriendsAndRequests();
        alert(`✅ Friend Request Accepted: ${from} is now your friend.`);
      });

      socket.on('join_request', ({ room, username }) => {
        alert(`🚪 Join Request: ${username} wants to join group ${room.replace('group:', '')}`);
        setCurrentRoom((prevRoom) => {
          if (prevRoom && prevRoom.name === room) {
            loadGroupDetails(room);
          }
          return prevRoom;
        });
      });

      socket.on('join_approved', ({ room }) => {
        const activeUser = Auth.getSession();
        loadRooms(activeUser);
        setCurrentRoom((prevRoom) => {
          if (prevRoom && prevRoom.name === room.name) {
            return { ...prevRoom, _member: true, _requested: false };
          }
          return prevRoom;
        });
        alert(`✅ Approved: You were approved to join ${room.displayName || room.name}`);
      });

      socket.on('spy_message', (msg) => {
        setAdminSpyMessages((prev) => [...prev, msg].slice(-100)); // cap at 100
      });

      socket.on('spy_message_deleted', ({ messageId }) => {
        setAdminSpyMessages((prev) => 
          prev.map(m => m._id === messageId ? { ...m, deleted: true, content: '[deleted]' } : m)
        );
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off('online_users');
        socketRef.current.off('new_message');
        socketRef.current.off('message_deleted');
        socketRef.current.off('user_typing');
        socketRef.current.off('friend_request');
        socketRef.current.off('friend_accepted');
        socketRef.current.off('join_request');
        socketRef.current.off('join_approved');
        socketRef.current.off('spy_message');
        socketRef.current.off('spy_message_deleted');
      }
    };
  }, [navigate]);

  // Load messages when current room changes
  useEffect(() => {
    if (!currentRoom) return;

    const isMember = currentRoom._member || session?.isAdmin || currentRoom.type === 'ai' || currentRoom.type === 'private';
    
    if (!isMember) {
      setMessages([]);
      return;
    }

    loadRoomMessages(currentRoom);

    // Join room on Socket.IO
    if (socketRef.current && currentRoom.type !== 'ai') {
      socketRef.current.emit('join_room', { room: currentRoom.name });
    }

    // Reset unread badges
    setRooms((prevRooms) => 
      prevRooms.map(r => r.name === currentRoom.name ? { ...r, _unread: 0 } : r)
    );

    if (currentRoom.type === 'group') {
      loadGroupDetails(currentRoom.name);
    }
  }, [currentRoom]);

  // Load Admin Tabs data on demand
  useEffect(() => {
    if (!session?.isAdmin || !showAdminPanel) return;
    if (adminActiveTab === 'users') loadAdminUsers();
    if (adminActiveTab === 'deleted') loadAdminDeletedMessages();
  }, [adminActiveTab, showAdminPanel]);

  // Typing event emitter
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    if (socketRef.current && currentRoom && currentRoom.type !== 'ai') {
      socketRef.current.emit('typing', { room: currentRoom.name });
    }
  };

  // SEND TEXT OR FILE MESSAGE
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() && !selectedFile) return;

    if (currentRoom.type === 'ai') {
      const userText = messageInput.trim();
      setMessageInput('');
      
      const userMsg = {
        _id: 'local-' + Date.now(),
        sender: session.username,
        content: userText,
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, userMsg]);
      aiHistoryRef.current.push({ role: 'user', content: userText });

      // Append thinking status
      const thinkingId = 'thinking-' + Date.now();
      setMessages((prev) => [...prev, { _id: thinkingId, sender: 'AI', content: 'thinking...', isThinking: true, timestamp: new Date().toISOString() }]);

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userText, history: aiHistoryRef.current.slice(-10) })
        });
        const data = await res.json();
        
        // Remove thinking status
        setMessages((prev) => prev.filter(m => m._id !== thinkingId));

        const reply = data.reply || 'The void remains silent.';
        aiHistoryRef.current.push({ role: 'assistant', content: reply });

        setMessages((prev) => [...prev, {
          _id: 'ai-' + Date.now(),
          sender: 'AI',
          content: reply,
          timestamp: new Date().toISOString()
        }]);

      } catch (err) {
        setMessages((prev) => prev.filter(m => m._id !== thinkingId));
        setMessages((prev) => [...prev, {
          _id: 'ai-err-' + Date.now(),
          sender: 'AI',
          content: 'The signal was lost. Re-transmit query.',
          timestamp: new Date().toISOString()
        }]);
      }
      return;
    }

    // Standard Socket Broadcast
    if (socketRef.current && currentRoom) {
      if (selectedFile) {
        socketRef.current.emit('send_file', {
          room: currentRoom.name,
          filename: selectedFile.name,
          filetype: selectedFile.type,
          filesize: selectedFile.size,
          data: selectedFile.data
        });
        setSelectedFile(null);
      }
      if (messageInput.trim()) {
        socketRef.current.emit('send_message', {
          room: currentRoom.name,
          content: messageInput.trim()
        });
        setMessageInput('');
      }
    }
  };

  // DELETE MESSAGE
  const handleDeleteMessage = (msgId) => {
    if (!msgId || msgId.startsWith('local-') || msgId.startsWith('ai-')) return;
    if (!window.confirm('Erase this record from the database?')) return;
    if (socketRef.current) {
      socketRef.current.emit('delete_message', { messageId: msgId });
    }
  };

  // BASE64 FILE CONVERTOR
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      if (!window.confirm("Warning: Sending files over 50MB via WebSockets might experience buffering limits. Proceed anyway?")) {
        e.target.value = '';
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedFile({
        name: file.name,
        type: file.type,
        size: file.size,
        data: event.target.result // Base64 Data URL
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // GROUP OPERATIONS
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const suffix = newGroupPrivacy === 'private' ? ':private' : '';
    const roomName = `group:${newGroupName.trim()}${suffix}`;

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: roomName,
          type: 'group',
          displayName: newGroupName.trim(),
          privacy: newGroupPrivacy,
          owner: session.username,
          members: [session.username]
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setShowNewGroupModal(false);
      setNewGroupName('');
      loadRooms(session);
      setCurrentRoom({ ...data, displayName: newGroupName.trim() });
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleJoinGroupRequest = async (e) => {
    e.preventDefault();
    if (!joinGroupName.trim()) return;

    const tryJoin = async (name) => {
      const res = await fetch(`/api/rooms/${encodeURIComponent(name)}/join`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        }
      });
      if (!res.ok) return null;
      return await res.json();
    };

    try {
      let result = await tryJoin(`group:${joinGroupName.trim()}`);
      if (!result) {
        result = await tryJoin(`group:${joinGroupName.trim()}:private`);
      }

      if (result) {
        if (result.status === 'requested') {
          alert('Join request sent to group owner!');
        } else if (result.status === 'already_member') {
          alert('You are already a member of this group.');
        }
        setShowJoinGroupModal(false);
        setJoinGroupName('');
      } else {
        alert('Group not found. Ensure the spelling is exact.');
      }
    } catch (err) {
      alert('Error joining: ' + err.message);
    }
  };

  const handleJoinGroupDirect = async (roomName) => {
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomName)}/join`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      if (data.status === 'requested') {
        alert('Join request sent to group owner/moderators!');
        setRooms((prev) => 
          prev.map(r => r.name === roomName ? { ...r, _requested: true } : r)
        );
        setCurrentRoom((prev) => {
          if (prev && prev.name === roomName) {
            return { ...prev, _requested: true };
          }
          return prev;
        });
      } else if (data.status === 'already_member') {
        alert('You are already a member of this group.');
        loadRooms(session);
      }
    } catch (err) {
      alert('Failed to send join request.');
    }
  };

  const handleChangeRole = async (username, role) => {
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(currentRoom.name)}/role`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ username, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      loadGroupDetails(currentRoom.name);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleKickMember = async (username) => {
    if (!window.confirm(`Kick ${username} from the group?`)) return;
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(currentRoom.name)}/kick/${encodeURIComponent(username)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      loadGroupDetails(currentRoom.name);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleApproveJoin = async (targetUsername) => {
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(currentRoom.name)}/approve/${encodeURIComponent(targetUsername)}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Notify target via websocket
      if (socketRef.current) {
        socketRef.current.emit('join_approved', { room: currentRoom, username: targetUsername });
      }
      loadGroupDetails(currentRoom.name);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRejectJoin = async (targetUsername) => {
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(currentRoom.name)}/reject/${encodeURIComponent(targetUsername)}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      loadGroupDetails(currentRoom.name);
    } catch (err) {
      alert(err.message);
    }
  };

  // DMs CREATION
  const handleOpenPrivateChat = async (e) => {
    e.preventDefault();
    if (!newPmUsername.trim()) return;
    if (newPmUsername.trim() === session.username) return;

    const sorted = [session.username, newPmUsername.trim()].sort();
    const roomName = `private:${sorted[0]}:${sorted[1]}`;
    const display = `💬 ${newPmUsername.trim()}`;

    const existing = rooms.find(r => r.name === roomName);
    if (existing) {
      setShowNewPrivateModal(false);
      setNewPmUsername('');
      setCurrentRoom(existing);
      return;
    }

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: roomName,
          type: 'private',
          members: [session.username, newPmUsername.trim()],
          displayName: display
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setShowNewPrivateModal(false);
      setNewPmUsername('');
      loadRooms(session);
      setCurrentRoom({ ...data, displayName: display });
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  // FRIENDS ACTIONS
  const handleSendFriendRequest = async (e) => {
    e.preventDefault();
    if (!addFriendUsername.trim()) return;

    try {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ username: addFriendUsername.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(`Friend request sent to ${addFriendUsername.trim()}!`);
      setShowAddFriendModal(false);
      setAddFriendUsername('');

      if (socketRef.current) {
        socketRef.current.emit('friend_request', { from: session.username, fromEmoji: session.emoji });
      }
      loadFriendsAndRequests();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAcceptFriend = async (targetUsername) => {
    try {
      const res = await fetch('/api/friends/accept', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ username: targetUsername })
      });
      if (!res.ok) throw new Error();
      
      if (socketRef.current) {
        socketRef.current.emit('friend_accepted', { from: session.username });
      }
      loadFriendsAndRequests();
    } catch (err) {
      alert('Failed to accept request');
    }
  };

  const handleRejectFriend = async (targetUsername) => {
    try {
      await fetch(`/api/friends/${encodeURIComponent(targetUsername)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadFriendsAndRequests();
    } catch (err) {
      console.error(err);
    }
  };

  // ADMIN CREDENTIALS EDIT
  const handleSaveAdminCredentials = async (e) => {
    e.preventDefault();
    setAdminCredMsg({ text: '', type: '' });
    if (!adminNewUsername && !adminNewPassword) return;

    try {
      const res = await fetch('/api/admin/credentials', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ newUsername: adminNewUsername.trim(), newPassword: adminNewPassword.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAdminCredMsg({ text: '✓ Credentials updated! Logging out...', type: 'success' });
      setTimeout(() => {
        Auth.logout();
        disconnectSocket();
        navigate('/login');
      }, 1500);

    } catch (err) {
      setAdminCredMsg({ text: '❌ ' + err.message, type: 'error' });
    }
  };

  // FILTERED ROOMS
  const filteredRooms = rooms.filter((r) => {
    if (isMobile) {
      if (mobileActiveView === 'groups') return r.type === 'group';
      // Chats view includes DMs and AI chat
      return r.type === 'private' || r.type === 'ai';
    }
    if (activeSideTab === 'all') return true;
    if (activeSideTab === 'friends') return false; // Friends loads its own panel
    return r.type === activeSideTab;
  });

  // FILTERED FRIENDS
  const filteredFriends = friends.filter((f) => 
    f.friend_username.toLowerCase().includes(friendSearch.toLowerCase())
  );

  return (
    <div className="chat-viewport fade-in" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="chat-wrapper">
        
        {/* SIDEBAR */}
        {(!isMobile || mobileActiveView === 'chats' || mobileActiveView === 'groups') && (!isTablet || showLeftSidebar) && (
          <aside className={`chat-sidebar ${isMobile ? 'mobile-full' : ''} ${isTablet ? 'tablet-overlay' : ''}`}>
            <div className="sidebar-header">
              <h2>BlackLight Chat</h2>
              {!isMobile && (
                <div className="sidebar-tabs">
                  <button className={`tab-btn ${activeSideTab === 'all' ? 'active' : ''}`} onClick={() => setActiveSideTab('all')}>All</button>
                  <button className={`tab-btn ${activeSideTab === 'group' ? 'active' : ''}`} onClick={() => setActiveSideTab('group')}>Group</button>
                  <button className={`tab-btn ${activeSideTab === 'private' ? 'active' : ''}`} onClick={() => setActiveSideTab('private')}>DMs</button>
                  <button className={`tab-btn ${activeSideTab === 'friends' ? 'active' : ''}`} onClick={() => { setActiveSideTab('friends'); loadFriendsAndRequests(); }}>Operatives</button>
                </div>
              )}
              {isMobile && mobileActiveView === 'chats' && (
                <div className="sidebar-tabs">
                  <button className={`tab-btn ${activeSideTab !== 'friends' ? 'active' : ''}`} onClick={() => setActiveSideTab('private')}>DMs</button>
                  <button className={`tab-btn ${activeSideTab === 'friends' ? 'active' : ''}`} onClick={() => { setActiveSideTab('friends'); loadFriendsAndRequests(); }}>Operatives</button>
                </div>
              )}
            </div>

            {activeSideTab !== 'friends' || (isMobile && mobileActiveView === 'groups') ? (
              <div className="room-list">
                {filteredRooms.map((room) => (
                  <div 
                    key={room.name} 
                    className={`room-item ${currentRoom?.name === room.name ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentRoom(room);
                      if (isMobile) {
                        setMobileActiveView('chat_window');
                      }
                    }}
                  >
                    <div className="room-avatar-icon">
                      {room.icon || (room.type === 'ai' ? '🤖' : room.type === 'group' ? '👥' : '💬')}
                    </div>
                    <div className="room-info-cell">
                      <div className="room-name-title">{room.displayName || room.name}</div>
                      <div className="room-preview-text">
                        {room.lastContent ? `${room.lastSender}: ${room.lastContent}` : '—'}
                      </div>
                    </div>
                    {room._unread > 0 && <span className="unread-badge">{room._unread}</span>}
                  </div>
                ))}
                
                <div className="sidebar-actions-btn-grid">
                  {(activeSideTab === 'group' || (isMobile && mobileActiveView === 'groups')) ? (
                    <>
                      <button className="new-room-btn" onClick={() => setShowNewGroupModal(true)}>+ Create Group</button>
                      <button className="new-room-btn" onClick={() => setShowJoinGroupModal(true)}>🚪 Join Group</button>
                    </>
                  ) : (
                    <button className="new-room-btn" onClick={() => setShowNewPrivateModal(true)}>+ Start DM</button>
                  )}
                  <button 
                    className="new-room-btn" 
                    onClick={() => navigate('/games')}
                    style={{
                      gridColumn: 'span 2',
                      marginTop: '8px',
                      background: 'rgba(0, 229, 255, 0.08)',
                      border: '1px solid rgba(0, 229, 255, 0.3)',
                      color: '#00e5ff',
                      boxShadow: '0 0 10px rgba(0, 229, 255, 0.15)',
                      textShadow: '0 0 5px rgba(0, 229, 255, 0.3)'
                    }}
                  >
                    ⚔️ Play Simulation Games
                  </button>
                </div>
              </div>
            ) : (
            <div className="friends-side-panel">
              <div className="friends-search-box">
                <input 
                  type="text" 
                  placeholder="Filter operatives..." 
                  value={friendSearch}
                  onChange={(e) => setFriendSearch(e.target.value)}
                />
              </div>

              {/* PENDING REQUESTS */}
              {friendRequests.length > 0 && (
                <div className="friends-list-section">
                  <div className="section-header-title">Pending Decrypts ({friendRequests.length})</div>
                  {friendRequests.map((r) => (
                    <div key={r.user1} className="friend-row-item request-row">
                      <span className="emoji">{r.emoji || '👤'}</span>
                      <div className="info">
                        <strong>{r.user1}</strong>
                        <span>Requesting contact...</span>
                      </div>
                      <div className="req-buttons">
                        <button className="accept-btn" onClick={() => handleAcceptFriend(r.user1)}><Check size={14} /></button>
                        <button className="reject-btn" onClick={() => handleRejectFriend(r.user1)}><X size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ALL FRIENDS */}
              <div className="friends-list-section">
                <div className="section-header-title">Contacts ({filteredFriends.length})</div>
                {filteredFriends.length === 0 ? (
                  <p className="empty-friends-txt">No operatives linked.</p>
                ) : (
                  filteredFriends.map((f) => {
                    const isOnline = onlineUsers.includes(f.friend_username);
                    return (
                      <div 
                        key={f.friend_username} 
                        className="friend-row-item clickable"
                        onClick={() => {
                          const sorted = [session.username, f.friend_username].sort();
                          setCurrentRoom({
                            name: `private:${sorted[0]}:${sorted[1]}`,
                            type: 'private',
                            displayName: `💬 ${f.friend_username}`,
                            _member: true // friends DMs always assume membership
                          });
                          if (isMobile) {
                            setMobileActiveView('chat_window');
                          }
                        }}
                      >
                        <span className="emoji">{f.emoji || '👤'}</span>
                        <div className="info">
                          <strong>{f.friend_username}</strong>
                          <span style={{ color: isOnline ? '#4ade80' : '#555' }}>
                            {isOnline ? 'Active' : 'Offline'}
                          </span>
                        </div>
                        <span className={`presence-dot ${isOnline ? 'online' : 'offline'}`}></span>
                      </div>
                    );
                  })
                )}
              </div>

              <button className="add-friend-btn-trigger btn-primary" onClick={() => setShowAddFriendModal(true)}>
                + Register operative
              </button>
            </div>
          )}
        </aside>
        )}

        {/* MAIN CHAT AREA */}
        {(!isMobile || mobileActiveView === 'chat_window') && (
          <main className="chat-main">
            {currentRoom ? (
              <>
                {/* TOPBAR */}
                <header className="chat-topbar">
                  {isMobile && (
                    <button className="mobile-back-btn" onClick={() => setMobileActiveView('chats')} title="Back to Channels">
                      <ArrowLeft size={20} />
                    </button>
                  )}
                  <div className="chat-topbar-icon">
                    {currentRoom.icon || (currentRoom.type === 'ai' ? '🤖' : currentRoom.type === 'group' ? '👥' : '💬')}
                  </div>
                  <div className="chat-topbar-info">
                    <div className="chat-topbar-name">{currentRoom.displayName || currentRoom.name}</div>
                    <div className="chat-topbar-sub">
                      {currentRoom.type === 'ai' ? 'BlackLight AI Oracle' : currentRoom.type === 'group' ? 'Multi-agent channel' : 'Direct secure channel'}
                    </div>
                  </div>

                  {/* Tablet Channels Toggle */}
                  {isTablet && (
                    <button className="btn-secondary tablet-toggle-btn" onClick={() => setShowLeftSidebar(!showLeftSidebar)} title="Toggle Channels">
                      <Menu size={16} />
                    </button>
                  )}

                  {/* Right Sidebar toggle button for mobile/tablet */}
                  {currentRoom?.type === 'group' && (isMobile || isTablet) && (
                    <button className="btn-secondary sidebar-toggle-btn" onClick={() => setShowRightSidebar(!showRightSidebar)} title="Toggle Members">
                      <Users size={16} />
                    </button>
                  )}

                  {currentRoom && currentRoom.type !== 'ai' && (
                    <button 
                      className={`voice-channel-toggle-btn ${voiceActive ? 'voice-active' : ''}`}
                      onClick={voiceActive ? stopVoiceChat : startVoiceChat}
                      title="Toggle Cyber Vocoder Voice Channel"
                    >
                      {voiceActive ? '🔊 Vocoder Connected' : '🎙️ Join Vocoder'}
                    </button>
                  )}

                  {session?.isAdmin && <span className="admin-status-badge">ADMIN MONITOR</span>}
                  {session?.isAdmin && (
                    <button className="btn-secondary admin-panel-toggle-btn" onClick={() => setShowAdminPanel(!showAdminPanel)}>
                      ⚙️ Dashboard
                    </button>
                  )}
                </header>

                {voiceActive && (
                  <div className="voice-status-bar-widget">
                    <div className="voice-info">
                      <span className="voice-dot"></span>
                      <strong>CYBER VOCODER ACTIVE</strong>
                    </div>
                    <canvas ref={voiceCanvasRef} width={120} height={24} className="voice-visualizer-canvas" />
                    <div className="voice-controls-row">
                      <button 
                        className={`voice-control-btn ${roboticFilter ? 'active' : ''}`}
                        onClick={() => setRoboticFilter(!roboticFilter)}
                      >
                        🤖 Robot Effect: {roboticFilter ? 'ON' : 'OFF'}
                      </button>
                      <button 
                        className={`voice-control-btn ${voiceMuted ? 'active' : ''}`}
                        onClick={() => setVoiceMuted(!voiceMuted)}
                      >
                        {voiceMuted ? '🔇 Muted' : '🎙️ Mute'}
                      </button>
                      <button className="voice-control-btn disconnect-btn" onClick={stopVoiceChat}>
                        Disconnect
                      </button>
                    </div>
                  </div>
                )}

              {currentRoom.type === 'group' && !currentRoom._member && !session?.isAdmin ? (
                <div className="restricted-group-overlay">
                  <Shield size={48} className="shield-icon" />
                  <h3>Access Restricted</h3>
                  <p>You are not a member of the group <strong>{currentRoom.displayName || currentRoom.name.replace('group:', '')}</strong>.</p>
                  {currentRoom._requested ? (
                    <div className="pending-status-box">
                      <span>Access request pending owner/moderator approval...</span>
                    </div>
                  ) : (
                    <button 
                      className="btn-primary join-request-btn"
                      onClick={() => handleJoinGroupDirect(currentRoom.name)}
                    >
                      Request Access to Group
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* MESSAGES VIEW */}
                  <div className="messages-area" ref={messagesAreaRef} onScroll={handleMessagesScroll}>
                    {messages.length === 0 && currentRoom.type !== 'ai' && (
                      <p className="empty-void-txt">Empty log stream. Speak into the void.</p>
                    )}
                    {messages.map((msg) => {
                      const isMine = msg.sender === session.username;
                      const isAI = msg.sender === 'AI';
                      const alignment = isMine ? 'mine' : isAI ? 'ai-msg' : 'theirs';
                      
                      let contentHtml = '';
                      if (msg.deleted) {
                        contentHtml = session.isAdmin 
                          ? `🗑️ Deleted by admin. [original: "${msg.originalContent}"]`
                          : `🗑️ This signal was intercepted and deleted.`;
                      } else if (msg.type === 'file') {
                        if (msg.filetype && msg.filetype.startsWith('image/')) {
                          contentHtml = <img src={msg.content} className="chat-img-embed" alt="attachment" onClick={() => window.open(msg.content)} />;
                        } else {
                          contentHtml = (
                            <div className="file-sharing-msg-card">
                              <span className="file-icon">📁</span>
                              <div className="file-details">
                                <span className="name">{msg.filename}</span>
                                <span className="size">{(msg.filesize / 1024 / 1024).toFixed(2)} MB</span>
                              </div>
                              <a href={msg.content} download={msg.filename} className="btn-primary file-dl-btn">Download</a>
                            </div>
                          );
                        }
                      } else if (msg.content && msg.content.startsWith('IMAGE:')) {
                        const url = msg.content.replace('IMAGE:', '').trim();
                        contentHtml = <img src={url} className="chat-img-embed" alt="AI Generated" onClick={() => window.open(url)} />;
                      } else if (msg.content && msg.content.startsWith('⚔️ GAME_INVITE:')) {
                        const gameName = msg.content.replace('⚔️ GAME_INVITE:', '').trim();
                        contentHtml = (
                          <div className="game-invite-msg-card">
                            <span className="game-icon">⚔️</span>
                            <div className="game-invite-details">
                              <span className="title">OPERATIVE CHALLENGE</span>
                              <span className="subtitle">Invite to play {gameName}</span>
                            </div>
                            <button 
                              className="btn-primary invite-accept-btn" 
                              onClick={() => navigate(`/games?mode=${encodeURIComponent(gameName)}`)}
                            >
                              Launch Session
                            </button>
                          </div>
                        );
                      } else if (msg.isThinking) {
                        contentHtml = <span style={{ color: '#555', fontStyle: 'italic' }}>thinking...</span>;
                      } else {
                        contentHtml = msg.content;
                      }

                      return (
                        <div key={msg._id} className={`message-row ${alignment} skin-${msg.skin || 'default'}`}>
                          {alignment !== 'mine' && (
                            <div className="msg-user-avatar">
                              {isAI ? '🤖' : msg.sender.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="msg-contents-wrap">
                            {alignment !== 'mine' && (
                              <span className={`sender-username-tag effect-${msg.skin || 'default'}`}>
                                {isAI ? 'BlackLight AI' : `@${msg.sender}`}
                              </span>
                            )}
                            <div className="msg-bubble-card">{contentHtml}</div>
                            <div className="msg-meta-row">
                              <span className="msg-timestamp">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {alignment === 'mine' && (
                                <span className="msg-read-status" title="Delivered secure transmission">✓✓</span>
                              )}
                              {(isMine || session.isAdmin) && !msg.deleted && !isAI && (
                                <button className="msg-delete-action-btn" onClick={() => handleDeleteMessage(msg._id)} title="Recall signal">
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                          {alignment === 'mine' && (
                            <div className="msg-user-avatar sender">
                              {session.emoji || '👁️'}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Typing Indicator */}
                    {typingUsers[currentRoom.name] && typingUsers[currentRoom.name] !== session.username && (
                      <div className="message-row theirs">
                        <div className="msg-user-avatar">
                          {typingUsers[currentRoom.name].substring(0, 2).toUpperCase()}
                        </div>
                        <div className="msg-contents-wrap">
                          <span className="sender-username-tag">@{typingUsers[currentRoom.name]}</span>
                          <div className="msg-bubble-card typing-bubble">
                            <div className="typing-dots"><span></span><span></span><span></span></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Scroll to Bottom FAB */}
                  {showScrollFab && (
                    <button 
                      className="scroll-to-bottom-fab btn-primary"
                      onClick={() => {
                        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                        setShowScrollFab(false);
                      }}
                      title="Snap to Live Stream"
                    >
                      ↓ LIVE STREAM
                    </button>
                  )}

                  {/* INPUT BAR */}
                  <div className="chat-input-container">
                    {/* File Preview */}
                    {selectedFile && (
                      <div className="selected-file-preview-strip">
                        <span>📎 Ready to dispatch: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                        <button className="clear-file-btn" onClick={() => setSelectedFile(null)}><X size={14} /></button>
                      </div>
                    )}
                    
                    {/* AI help connector bar (for users inside AI room) */}
                    {currentRoom.type === 'ai' && !session.isAdmin && (
                      <div className="support-connect-helper-bar">
                        <span>Stuck or experiencing issues?</span>
                        <button 
                          className="btn-secondary support-btn"
                          onClick={async () => {
                            // Locate admin username and start private DM
                            let adminUser = 'shehram';
                            try {
                              const res = await fetch('/api/users');
                              const users = await res.json();
                              const found = users.find(u => u.isAdmin);
                              if (found) adminUser = found.username;
                            } catch {}
                            const sorted = [session.username, adminUser].sort();
                            setCurrentRoom({
                              name: `private:${sorted[0]}:${sorted[1]}`,
                              type: 'private',
                              displayName: `🎧 Support (${adminUser})`
                            });
                          }}
                        >
                          🎧 Connect to Support Agent
                        </button>
                      </div>
                    )}

                    <form className="chat-input-form" onSubmit={handleSendMessage}>
                      {currentRoom.type !== 'ai' && (
                        <>
                          <button type="button" className="attach-file-btn" onClick={() => fileInputRef.current?.click()} title="Send File attachment">
                            <Paperclip size={18} />
                          </button>
                          <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />
                        </>
                      )}
                      <input 
                        type="text" 
                        placeholder="Enter cryptographic message..." 
                        value={messageInput}
                        onChange={handleInputChange}
                      />
                      <button type="submit" className="send-msg-btn btn-primary"><Send size={16} /></button>
                    </form>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="no-room-selected-screen">
              <MessageSquare size={48} className="fallback-eye" />
              <h3>Secure Channel Offline</h3>
              <p>Select an operative or channel category from the left sidebar to decrypt communications.</p>
            </div>
          )}
        </main>
        )}

        {/* GROUP INFO PANEL (RIGHT PANEL) */}
        {currentRoom?.type === 'group' && (currentRoom._member || session?.isAdmin) && (!isMobile && !isTablet || showRightSidebar) && (
          <aside className={`group-sidebar-right ${(isMobile || isTablet) ? 'overlay-drawer' : ''}`}>
            {(isMobile || isTablet) && (
              <div className="sidebar-close-header">
                <button className="close-right-sidebar-btn" onClick={() => setShowRightSidebar(false)} title="Close Panel">
                  <X size={20} />
                </button>
              </div>
            )}
            
            {/* JOIN REQUESTS FOR OWNER */}
            {pendingJoinRequests.length > 0 && (
              <div className="group-requests-banner visible">
                <div className="section-header-title">Membership Requests</div>
                {pendingJoinRequests.map((req) => (
                  <div key={req.username} className="request-card-item">
                    <span>@{req.username}</span>
                    <div className="btn-actions">
                      <button className="approve btn-primary" onClick={() => handleApproveJoin(req.username)}>Approve</button>
                      <button className="reject btn-secondary" onClick={() => handleRejectJoin(req.username)}>Deny</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="group-members-list-container">
              <div className="section-header-title">Group Operatives ({groupMembers.length})</div>
              {groupMembers.map((member) => {
                const isOwner = currentRoom.owner === session.username || session.isAdmin;
                const myMemberData = groupMembers.find(m => m.username === session.username);
                const isMod = myMemberData?.role === 'moderator';

                const canManage = member.username !== session.username && 
                                  (isOwner && member.role !== 'owner' || 
                                   isMod && member.role !== 'owner' && member.role !== 'moderator');

                return (
                  <div key={member.username} className="group-member-row">
                    <span className="avatar">{member.emoji || '👤'}</span>
                    <div className="info">
                      <strong>{member.username}</strong>
                      <span className={`role-badge role-${member.role || 'member'}`}>{member.role || 'member'}</span>
                    </div>

                    {canManage && (
                      <div className="member-management-dropdown-wrap">
                        <button className="mgmt-gear-btn"><Settings size={14} /></button>
                        <div className="mgmt-dropdown-menu">
                          {isOwner && (
                            <button onClick={() => handleChangeRole(member.username, member.role === 'moderator' ? 'member' : 'moderator')}>
                              {member.role === 'moderator' ? 'Demote User' : 'Promote Mod'}
                            </button>
                          )}
                          <button onClick={() => handleChangeRole(member.username, member.role === 'muted' ? 'member' : 'muted')}>
                            {member.role === 'muted' ? 'Unmute User' : 'Mute User'}
                          </button>
                          <button className="kick" onClick={() => handleKickMember(member.username)}>
                            Kick operative
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* ADMIN MONITOR BOARD (SPY PANEL RIGHT PANEL) */}
        {session?.isAdmin && showAdminPanel && (
          <aside className="admin-spy-dashboard-side">
            <div className="admin-spy-header">
              <h3>Spy Terminal</h3>
              <button className="close-spy-btn" onClick={() => setShowAdminPanel(false)}>✕</button>
            </div>
            
            <div className="admin-spy-tabs">
              <button className={`spy-tab ${adminActiveTab === 'online' ? 'active' : ''}`} onClick={() => setAdminActiveTab('online')}>Online</button>
              <button className={`spy-tab ${adminActiveTab === 'users' ? 'active' : ''}`} onClick={() => setAdminActiveTab('users')}>Agents</button>
              <button className={`spy-tab ${adminActiveTab === 'deleted' ? 'active' : ''}`} onClick={() => setAdminActiveTab('deleted')}>Deleted</button>
              <button className={`spy-tab ${adminActiveTab === 'spy' ? 'active' : ''}`} onClick={() => setAdminActiveTab('spy')}>Live Spy</button>
              <button className={`spy-tab ${adminActiveTab === 'creds' ? 'active' : ''}`} onClick={() => setAdminActiveTab('creds')}>Auth</button>
            </div>

            <div className="spy-tab-content-area">
              
              {/* ONLINE STATUS */}
              {adminActiveTab === 'online' && (
                <div className="spy-online-list">
                  <div className="spy-section-title">Active Sockets ({onlineUsers.length})</div>
                  {onlineUsers.map(u => (
                    <div key={u} className="spy-online-row">
                      <span className="online-dot"></span>
                      <span>{u}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* USERS REGISTRATION */}
              {adminActiveTab === 'users' && (
                <div className="spy-users-list">
                  <div className="spy-section-title">Registered Agents</div>
                  {adminUsers.map(u => (
                    <div key={u.id} className="spy-user-row clickable" onClick={() => {
                      const sorted = [session.username, u.username].sort();
                      setCurrentRoom({
                        name: `private:${sorted[0]}:${sorted[1]}`,
                        type: 'private',
                        displayName: `💬 ${u.username}`
                      });
                    }}>
                      <span className="emoji">{u.emoji || '👤'}</span>
                      <div className="info">
                        <strong>{u.username}</strong>
                        <span>{u.email}</span>
                      </div>
                      {u.isAdmin && <span className="spy-admin-badge">ADMIN</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* AUDIT LOG FOR DELETIONS */}
              {adminActiveTab === 'deleted' && (
                <div className="spy-deleted-list">
                  <div className="spy-section-title">Erase Logs Audit</div>
                  {adminDeletedMsgs.length === 0 ? (
                    <p className="spy-empty-log-txt">No deleted signals recorded.</p>
                  ) : (
                    adminDeletedMsgs.map(m => (
                      <div key={m.id} className="spy-deleted-card">
                        <div className="top">
                          <span className="sender">{m.sender}</span>
                          <span className="room" onClick={() => {
                            setCurrentRoom({ name: m.room, type: m.room.startsWith('group:') ? 'group' : 'private', displayName: m.room.substring(0, 15) });
                          }}>[Jump]</span>
                        </div>
                        <p className="original">"{m.originalContent}"</p>
                        <span className="deleted-by">Erase requested by: @{m.deletedBy}</span>
                        <span className="time">{new Date(m.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* LIVE SPY FEED */}
              {adminActiveTab === 'spy' && (
                <div className="spy-live-feed">
                  <div className="spy-section-title">Intercepted Signals (Live)</div>
                  {adminSpyMessages.length === 0 ? (
                    <p className="spy-empty-log-txt">Listening for network traffic...</p>
                  ) : (
                    adminSpyMessages.map((m, idx) => (
                      <div key={idx} className="spy-feed-card">
                        <div className="top">
                          <strong>{m.sender}</strong>
                          <span>in {m.room.replace('group:', '').replace('private:', '')}</span>
                        </div>
                        <p className="content">
                          {m.deleted ? (
                            <span style={{ color: '#ff3333', fontStyle: 'italic' }}>[signal deleted]</span>
                          ) : m.type === 'file' ? (
                            `[Attachment dispatch: ${m.filename}]`
                          ) : (
                            m.content
                          )}
                        </p>
                        <span className="time">{new Date(m.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* SECURITY CONFIGS */}
              {adminActiveTab === 'creds' && (
                <form className="spy-creds-form" onSubmit={handleSaveAdminCredentials}>
                  <div className="spy-section-title">Modify Credentials</div>
                  <div className="input-group">
                    <label>New Username</label>
                    <input type="text" placeholder="New handle" value={adminNewUsername} onChange={(e) => setAdminNewUsername(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>New Password</label>
                    <input type="password" placeholder="••••••••" value={adminNewPassword} onChange={(e) => setAdminNewPassword(e.target.value)} />
                  </div>
                  <button type="submit" className="btn-primary">Commit Config Changes</button>
                  {adminCredMsg.text && (
                    <p style={{ color: adminCredMsg.type === 'success' ? '#4ade80' : '#ff6b6b', fontSize: '0.8rem', marginTop: '10px' }}>
                      {adminCredMsg.text}
                    </p>
                  )}
                </form>
              )}

            </div>
          </aside>
        )}

      </div>

      {/* CREATE GROUP MODAL */}
      {showNewGroupModal && (
        <div className="modal-overlay" onClick={() => setShowNewGroupModal(false)}>
          <div className="modal-box glass-panel" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowNewGroupModal(false)}>✕</button>
            <h2>Create Group Channel</h2>
            <form onSubmit={handleCreateGroup}>
              <div className="input-group">
                <label>Group Name</label>
                <input type="text" placeholder="e.g. ward-c" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Privacy Clearance</label>
                <select value={newGroupPrivacy} onChange={(e) => setNewGroupPrivacy(e.target.value)}>
                  <option value="public">Public (Open for Operatives)</option>
                  <option value="private">Private (Invite Approval Only)</option>
                </select>
              </div>
              <button type="submit" className="btn-submit">Initialize Group</button>
            </form>
          </div>
        </div>
      )}

      {/* START DM MODAL */}
      {showNewPrivateModal && (
        <div className="modal-overlay" onClick={() => setShowNewPrivateModal(false)}>
          <div className="modal-box glass-panel" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowNewPrivateModal(false)}>✕</button>
            <h2>Establish DM Connection</h2>
            <form onSubmit={handleOpenPrivateChat}>
              <div className="input-group">
                <label>Operative Username</label>
                <input type="text" placeholder="e.g. shadowblade" value={newPmUsername} onChange={(e) => setNewPmUsername(e.target.value)} required />
              </div>
              <button type="submit" className="btn-submit">Connect Securely</button>
            </form>
          </div>
        </div>
      )}

      {/* JOIN GROUP MODAL */}
      {showJoinGroupModal && (
        <div className="modal-overlay" onClick={() => setShowJoinGroupModal(false)}>
          <div className="modal-box glass-panel" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowJoinGroupModal(false)}>✕</button>
            <h2>Decrypt Group Channel</h2>
            <form onSubmit={handleJoinGroupRequest}>
              <div className="input-group">
                <label>Exact Group Name</label>
                <input type="text" placeholder="e.g. alpha-squad" value={joinGroupName} onChange={(e) => setJoinGroupName(e.target.value)} required />
              </div>
              <button type="submit" className="btn-submit">Submit Entry Request</button>
            </form>
          </div>
        </div>
      )}

      {/* ADD FRIEND REQUEST MODAL */}
      {showAddFriendModal && (
        <div className="modal-overlay" onClick={() => setShowAddFriendModal(false)}>
          <div className="modal-box glass-panel" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAddFriendModal(false)}>✕</button>
            <h2>Register Operative Contact</h2>
            <form onSubmit={handleSendFriendRequest}>
              <div className="input-group">
                <label>Operative Username</label>
                <input type="text" placeholder="Search by name tag" value={addFriendUsername} onChange={(e) => setAddFriendUsername(e.target.value)} required />
              </div>
              <button type="submit" className="btn-submit">Dispatch Link Request</button>
            </form>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION */}
      {isMobile && (
        <nav className="mobile-bottom-nav">
          <button 
            className="nav-item-btn"
            onClick={() => navigate('/')}
          >
            <Home size={20} />
            <span>Home</span>
          </button>
          <button 
            className={`nav-item-btn ${mobileActiveView === 'chats' && activeSideTab !== 'friends' ? 'active' : ''}`}
            onClick={() => {
              setMobileActiveView('chats');
              setActiveSideTab('private');
            }}
          >
            <MessageSquare size={20} />
            <span>Chats</span>
          </button>
          <button 
            className={`nav-item-btn ${currentRoom?.type === 'ai' && mobileActiveView === 'chat_window' ? 'active' : ''}`}
            onClick={() => {
              const aiRoom = rooms.find(r => r.type === 'ai');
              if (aiRoom) {
                setCurrentRoom(aiRoom);
                setMobileActiveView('chat_window');
              }
            }}
          >
            <Bot size={20} />
            <span>AI</span>
          </button>
          <button 
            className={`nav-item-btn ${mobileActiveView === 'groups' ? 'active' : ''}`}
            onClick={() => {
              setMobileActiveView('groups');
              setActiveSideTab('group');
            }}
          >
            <Users size={20} />
            <span>Groups</span>
          </button>
          <button 
            className="nav-item-btn"
            onClick={() => navigate('/profile')}
          >
            <User size={20} />
            <span>Profile</span>
          </button>
        </nav>
      )}

    </div>
  );
};

export default Chat;
