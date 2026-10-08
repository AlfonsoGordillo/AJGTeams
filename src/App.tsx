/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Participant, TranscriptItem } from './types';
import { Lobby } from './components/Lobby';
import { MeetingHeader } from './components/MeetingHeader';
import { VideoGrid } from './components/VideoGrid';
import { BottomControls } from './components/BottomControls';
import { InviteDrawer } from './components/InviteDrawer';
import { PeopleDrawer } from './components/PeopleDrawer';
import { TranscriptDrawer } from './components/TranscriptDrawer';
import { DocumentTranslationModal } from './components/DocumentTranslationModal';
import { SettingsModal } from './components/SettingsModal';
import { DeviceModal } from './components/DeviceModal';
import { BackgroundModal } from './components/BackgroundModal';
import { ScreenShareModal } from './components/ScreenShareModal';
import { speechService } from './services/speechService';
import { WebRTCManager } from './services/webrtc';
import { getLanguageByCode } from './constants/languages';

export default function App() {
  const [inCall, setInCall] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [currentUser, setCurrentUser] = useState<Participant>({
    id: `user-${Math.random().toString(36).substring(2, 7)}`,
    name: 'Alfonso Gordillo',
    spokenLang: 'es',
    targetLang: 'en',
    isMuted: false,
    isCameraOff: false,
    isHandRaised: false,
    isSpeaking: false,
    isLocal: true,
    backgroundType: 'none',
  });

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [activeSubtitle, setActiveSubtitle] = useState<TranscriptItem | null>(null);

  // Feature Flags
  const [showCaptions, setShowCaptions] = useState(true);
  const [isDubbingActive, setIsDubbingActive] = useState(true);
  const [muteOriginalAudio, setMuteOriginalAudio] = useState(false); // Apagar la voz original, solo oír la traducción
  const [isVirtualPartnerActive, setIsVirtualPartnerActive] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [selectedMicId, setSelectedMicId] = useState('');
  const [selectedSpeakerId, setSelectedSpeakerId] = useState('');
  const [isDocumentStudioOpen, setIsDocumentStudioOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [useGeminiTTS, setUseGeminiTTS] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('Kore');

  // Background and Screen Share States
  const [isBgModalOpen, setIsBgModalOpen] = useState(false);
  const [isScreenShareModalOpen, setIsScreenShareModalOpen] = useState(false);
  const [customBackgrounds, setCustomBackgrounds] = useState<string[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const originalCamStreamRef = useRef<MediaStream | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const webrtcRef = useRef<WebRTCManager | null>(null);
  const subtitleTimeoutRef = useRef<any>(null);

  // Device switching handlers for active call
  const handleSelectCamera = async (deviceId: string) => {
    setSelectedCameraId(deviceId);
    if (!currentUser.stream) return;
    try {
      const newVideoStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId }, width: 1280, height: 720 },
      });
      const newVideoTrack = newVideoStream.getVideoTracks()[0];
      const oldVideoTrack = currentUser.stream.getVideoTracks()[0];
      if (oldVideoTrack) {
        currentUser.stream.removeTrack(oldVideoTrack);
        oldVideoTrack.stop();
      }
      currentUser.stream.addTrack(newVideoTrack);
      if (webrtcRef.current) {
        webrtcRef.current.setLocalStream(currentUser.stream);
      }
      setCurrentUser((prev) => ({ ...prev, stream: currentUser.stream }));
    } catch (e) {
      console.warn('Error switching camera in active call:', e);
    }
  };

  const handleSelectMic = async (deviceId: string) => {
    setSelectedMicId(deviceId);
    if (!currentUser.stream) return;
    try {
      const newAudioStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
      });
      const newAudioTrack = newAudioStream.getAudioTracks()[0];
      const oldAudioTrack = currentUser.stream.getAudioTracks()[0];
      if (oldAudioTrack) {
        currentUser.stream.removeTrack(oldAudioTrack);
        oldAudioTrack.stop();
      }
      currentUser.stream.addTrack(newAudioTrack);
      if (webrtcRef.current) {
        webrtcRef.current.setLocalStream(currentUser.stream);
      }
      setCurrentUser((prev) => ({ ...prev, stream: currentUser.stream }));
    } catch (e) {
      console.warn('Error switching microphone in active call:', e);
    }
  };

  const handleSelectSpeaker = (deviceId: string) => {
    setSelectedSpeakerId(deviceId);
    if (typeof document !== 'undefined') {
      const mediaElements = document.querySelectorAll('audio, video');
      mediaElements.forEach((el: any) => {
        if (typeof el.setSinkId === 'function') {
          el.setSinkId(deviceId).catch((e: any) => console.warn('setSinkId failed:', e));
        }
      });
    }
  };

  // Check URL parameters for invitation link on initial load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      setRoomId(roomParam);
    }
  }, []);

  // Initialize Call Connection
  const handleJoinMeeting = (config: {
    roomId: string;
    userName: string;
    spokenLang: string;
    targetLang: string;
    isMuted: boolean;
    isCameraOff: boolean;
    stream: MediaStream | null;
    backgroundType?: 'none' | 'blur' | 'preset' | 'custom';
    backgroundUrl?: string;
  }) => {
    setRoomId(config.roomId);
    originalCamStreamRef.current = config.stream;

    // Update current user
    const updatedUser: Participant = {
      ...currentUser,
      name: config.userName,
      spokenLang: config.spokenLang,
      targetLang: config.targetLang,
      isMuted: config.isMuted,
      isCameraOff: config.isCameraOff,
      stream: config.stream,
      backgroundType: config.backgroundType || 'none',
      backgroundUrl: config.backgroundUrl,
    };
    setCurrentUser(updatedUser);
    setParticipants([updatedUser]);
    setInCall(true);

    // Update speech service languages
    speechService.setSpokenLanguage(config.spokenLang);
    speechService.setTargetLanguage(config.targetLang);

    // Connect WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    // Initialize WebRTC Manager
    const webrtc = new WebRTCManager({
      localStream: config.stream,
      onRemoteStream: (peerId, remoteStream) => {
        setParticipants((prev) =>
          prev.map((p) => (p.id === peerId ? { ...p, stream: remoteStream } : p))
        );
      },
      onSendSignal: (targetPeerId, signal) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'webrtc_signal',
              roomId: config.roomId,
              targetPeerId,
              signal,
            })
          );
        }
      },
    });
    webrtcRef.current = webrtc;

    ws.onopen = () => {
      // Join Room
      ws.send(
        JSON.stringify({
          type: 'join_room',
          roomId: config.roomId,
          peerId: updatedUser.id,
          participant: {
            id: updatedUser.id,
            name: updatedUser.name,
            spokenLang: updatedUser.spokenLang,
            targetLang: updatedUser.targetLang,
            isMuted: updatedUser.isMuted,
            isCameraOff: updatedUser.isCameraOff,
            isHandRaised: false,
            isSpeaking: false,
            backgroundType: updatedUser.backgroundType,
            backgroundUrl: updatedUser.backgroundUrl,
          },
        })
      );

      // Start listening to microphone if unmuted
      if (!config.isMuted) {
        startSpeechListening(updatedUser);
      }
    };

    ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case 'room_joined': {
            const peers = msg.peers || [];
            const peerParticipants: Participant[] = peers.map((p: any) => ({
              ...p,
              isLocal: false,
            }));
            setParticipants([updatedUser, ...peerParticipants]);
            if (msg.transcripts) {
              setTranscripts(msg.transcripts);
            }
            break;
          }

          case 'peer_joined': {
            const newPeer: Participant = {
              ...msg.peer,
              isLocal: false,
            };
            setParticipants((prev) => {
              if (prev.some((p) => p.id === newPeer.id)) return prev;
              return [...prev, newPeer];
            });

            // Initiate WebRTC call with newcomer
            webrtc.initiateCall(newPeer.id);
            break;
          }

          case 'webrtc_signal': {
            webrtc.handleSignal(msg.senderPeerId, msg.signal);
            break;
          }

          case 'speech_transcript': {
            const item: TranscriptItem = msg.transcript;
            handleIncomingTranscript(item, updatedUser);
            break;
          }

          case 'virtual_partner_speech': {
            const item: TranscriptItem = msg.transcript;
            // Highlight Sarah as speaking
            setParticipants((prev) =>
              prev.map((p) => (p.id === 'virtual-partner' ? { ...p, isSpeaking: true } : p))
            );
            handleIncomingTranscript(item, updatedUser);
            setTimeout(() => {
              setParticipants((prev) =>
                prev.map((p) => (p.id === 'virtual-partner' ? { ...p, isSpeaking: false } : p))
              );
            }, 3500);
            break;
          }

          case 'participant_update': {
            const { peerId, participant } = msg;
            setParticipants((prev) =>
              prev.map((p) => (p.id === peerId ? { ...p, ...participant } : p))
            );
            break;
          }

          case 'peer_left': {
            const { peerId } = msg;
            webrtc.removePeer(peerId);
            setParticipants((prev) => prev.filter((p) => p.id !== peerId));
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    };
  };

  // Start Speech Recognition loop
  const startSpeechListening = (user: Participant) => {
    speechService.startListening(
      async (result) => {
        // If speaking, set local speaking state
        setCurrentUser((prev) => ({ ...prev, isSpeaking: true }));
        setParticipants((prev) =>
          prev.map((p) => (p.isLocal ? { ...p, isSpeaking: true } : p))
        );
        broadcastParticipantUpdate({ isSpeaking: true });

        // Interim live caption for local preview
        if (!result.isFinal) {
          setActiveSubtitle({
            id: 'interim',
            speakerId: user.id,
            speakerName: `${user.name} (Hablando...)`,
            originalText: result.text,
            sourceLang: user.spokenLang,
            translatedText: 'Traduciendo en tiempo real...',
            targetLang: user.targetLang,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          });
          return;
        }

        // When speech is final: Translate via Gemini
        try {
          const translated = await speechService.translateText(
            result.text,
            user.spokenLang,
            user.targetLang,
            isOffline
          );

          const transcriptItem: TranscriptItem = {
            id: `tr-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            speakerId: user.id,
            speakerName: user.name,
            originalText: result.text,
            sourceLang: user.spokenLang,
            translatedText: translated,
            targetLang: user.targetLang,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            isOffline,
          };

          // Send transcript to room
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: 'speech_transcript',
                roomId,
                transcript: transcriptItem,
              })
            );

            // If virtual partner mode is active, trigger AI partner reply in English
            if (isVirtualPartnerActive) {
              setParticipants((prev) =>
                prev.map((p) => (p.id === 'virtual-partner' ? { ...p, isSpeaking: true } : p))
              );

              wsRef.current.send(
                JSON.stringify({
                  type: 'virtual_partner_request',
                  roomId,
                  userText: result.text,
                  userLang: getLanguageByCode(user.spokenLang).name,
                  partnerLang: 'English',
                  partnerName: 'Sarah (Chicago, US)',
                })
              );
            }
          }
        } catch (e) {
          console.error('Translation error on final speech:', e);
        } finally {
          setTimeout(() => {
            setCurrentUser((prev) => ({ ...prev, isSpeaking: false }));
            setParticipants((prev) =>
              prev.map((p) => (p.isLocal ? { ...p, isSpeaking: false } : p))
            );
            broadcastParticipantUpdate({ isSpeaking: false });
          }, 600);
        }
      },
      (err) => {
        console.warn('Speech recognition warning:', err);
      }
    );
  };

  const handleIncomingTranscript = (
    item: TranscriptItem,
    user: Participant
  ) => {
    setTranscripts((prev) => [...prev, item]);
    setActiveSubtitle(item);

    // Clear active subtitle after 6 seconds of silence
    if (subtitleTimeoutRef.current) {
      clearTimeout(subtitleTimeoutRef.current);
    }
    subtitleTimeoutRef.current = setTimeout(() => {
      setActiveSubtitle(null);
    }, 6000);

    // Audio Playback:
    // If incoming speech is from another participant or Sarah:
    if (isDubbingActive && item.speakerId !== user.id) {
      if (item.speakerId === 'virtual-partner') {
        // If muteOriginalAudio is true, speak the Spanish translation
        // If false, speak Sarah's natural English voice!
        const textToSpeak = muteOriginalAudio ? item.translatedText : item.originalText;
        const langToSpeak = muteOriginalAudio ? user.spokenLang : item.sourceLang;
        speechService.speakTranslatedText(textToSpeak, langToSpeak, useGeminiTTS);
      } else {
        speechService.speakTranslatedText(item.translatedText, user.spokenLang, useGeminiTTS);
      }
    }
  };

  const broadcastParticipantUpdate = (updates: Partial<Participant>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'participant_update',
          roomId,
          participant: updates,
        })
      );
    }
  };

  // Toggle Controls
  const handleToggleMic = () => {
    const nextMuted = !currentUser.isMuted;
    setCurrentUser((prev) => ({ ...prev, isMuted: nextMuted }));
    setParticipants((prev) =>
      prev.map((p) => (p.isLocal ? { ...p, isMuted: nextMuted } : p))
    );
    if (currentUser.stream) {
      currentUser.stream.getAudioTracks().forEach((t) => (t.enabled = !nextMuted));
    }
    broadcastParticipantUpdate({ isMuted: nextMuted });

    if (nextMuted) {
      speechService.stopListening();
    } else {
      speechService.startListening();
    }
  };

  const handleToggleCamera = () => {
    const nextCameraOff = !currentUser.isCameraOff;
    setCurrentUser((prev) => ({ ...prev, isCameraOff: nextCameraOff }));
    setParticipants((prev) =>
      prev.map((p) => (p.isLocal ? { ...p, isCameraOff: nextCameraOff } : p))
    );
    if (currentUser.stream) {
      currentUser.stream.getVideoTracks().forEach((t) => (t.enabled = !nextCameraOff));
    }
    broadcastParticipantUpdate({ isCameraOff: nextCameraOff });
  };

  const handleToggleHand = () => {
    const nextHand = !currentUser.isHandRaised;
    setCurrentUser((prev) => ({ ...prev, isHandRaised: nextHand }));
    setParticipants((prev) =>
      prev.map((p) => (p.isLocal ? { ...p, isHandRaised: nextHand } : p))
    );
    broadcastParticipantUpdate({ isHandRaised: nextHand });
  };

  // Virtual Partner Sarah Greeting Trigger
  const triggerSarahGreeting = async () => {
    const greetingOriginal = "Hi Alfonso! I'm Sarah from Chicago. I'm connected and ready. Speak to me in Spanish and you'll hear my voice translated in real time. How are you today?";
    const greetingTranslated = "¡Hola Alfonso! Soy Sarah de Chicago. Estoy conectada y lista. Háblame en español y escucharás mi voz traducida en tiempo real. ¿Cómo estás hoy?";

    const transcriptItem: TranscriptItem = {
      id: `vp-greeting-${Date.now()}`,
      speakerId: 'virtual-partner',
      speakerName: 'Sarah (Chicago, US)',
      originalText: greetingOriginal,
      sourceLang: 'en',
      translatedText: greetingTranslated,
      targetLang: currentUser.spokenLang,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setParticipants((prev) =>
      prev.map((p) => (p.id === 'virtual-partner' ? { ...p, isSpeaking: true } : p))
    );

    handleIncomingTranscript(transcriptItem, currentUser);

    const textToSpeak = muteOriginalAudio ? greetingTranslated : greetingOriginal;
    const langToSpeak = muteOriginalAudio ? currentUser.spokenLang : 'en';
    await speechService.speakTranslatedText(textToSpeak, langToSpeak, useGeminiTTS);

    setTimeout(() => {
      setParticipants((prev) =>
        prev.map((p) => (p.id === 'virtual-partner' ? { ...p, isSpeaking: false } : p))
      );
    }, 4500);
  };

  const handleToggleVirtualPartner = () => {
    const nextState = !isVirtualPartnerActive;
    setIsVirtualPartnerActive(nextState);

    if (nextState) {
      // Add Virtual Partner participant to UI
      const virtualParticipant: Participant = {
        id: 'virtual-partner',
        name: 'Sarah (Chicago, US)',
        spokenLang: 'en',
        targetLang: 'es',
        isMuted: false,
        isCameraOff: false,
        isHandRaised: false,
        isSpeaking: false,
        isVirtual: true,
      };
      setParticipants((prev) => {
        if (prev.some((p) => p.id === 'virtual-partner')) return prev;
        return [...prev, virtualParticipant];
      });

      // Automatically trigger Sarah's greeting after 400ms!
      setTimeout(() => {
        triggerSarahGreeting();
      }, 400);
    } else {
      setParticipants((prev) => prev.filter((p) => p.id !== 'virtual-partner'));
    }
  };

  // Screen Sharing Implementation (Con y Sin Sonido)
  const handleStartScreenShare = async (withAudio: boolean) => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: withAudio,
      });

      if (!isScreenSharing && currentUser.stream) {
        originalCamStreamRef.current = currentUser.stream;
      }

      setIsScreenSharing(true);
      setCurrentUser((prev) => ({
        ...prev,
        stream: displayStream,
        isScreenShare: true,
      }));
      setParticipants((prev) =>
        prev.map((p) =>
          p.isLocal ? { ...p, stream: displayStream, isScreenShare: true } : p
        )
      );

      if (webrtcRef.current) {
        webrtcRef.current.setLocalStream(displayStream);
      }

      broadcastParticipantUpdate({ isScreenShare: true });

      const videoTrack = displayStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          handleStopScreenShare();
        };
      }
    } catch (err) {
      console.warn('Screen sharing cancelled or not supported:', err);
    }
  };

  const handleStopScreenShare = () => {
    setIsScreenSharing(false);
    if (currentUser.stream) {
      currentUser.stream.getTracks().forEach((track) => {
        if (track.label.toLowerCase().includes('screen') || track.kind === 'video') {
          track.stop();
        }
      });
    }

    const camStream = originalCamStreamRef.current;
    setCurrentUser((prev) => ({
      ...prev,
      stream: camStream,
      isScreenShare: false,
    }));
    setParticipants((prev) =>
      prev.map((p) =>
        p.isLocal ? { ...p, stream: camStream, isScreenShare: false } : p
      )
    );

    if (webrtcRef.current) {
      webrtcRef.current.setLocalStream(camStream);
    }

    broadcastParticipantUpdate({ isScreenShare: false });
  };

  // Background Change Handler (CRITICAL FIX: Updates both currentUser and participants list!)
  const handleSelectBackground = (bg: {
    type: 'none' | 'blur' | 'preset' | 'custom';
    url?: string;
  }) => {
    setCurrentUser((prev) => ({
      ...prev,
      backgroundType: bg.type,
      backgroundUrl: bg.url,
    }));

    setParticipants((prev) =>
      prev.map((p) =>
        p.isLocal
          ? { ...p, backgroundType: bg.type, backgroundUrl: bg.url }
          : p
      )
    );

    broadcastParticipantUpdate({
      backgroundType: bg.type,
      backgroundUrl: bg.url,
    });
  };

  // Send quick speech text (for testing with Sarah or call)
  const handleSendQuickSpeech = async (text: string) => {
    try {
      const translated = await speechService.translateText(
        text,
        currentUser.spokenLang,
        currentUser.targetLang,
        isOffline
      );

      const transcriptItem: TranscriptItem = {
        id: `tr-${Date.now()}`,
        speakerId: currentUser.id,
        speakerName: currentUser.name,
        originalText: text,
        sourceLang: currentUser.spokenLang,
        translatedText: translated,
        targetLang: currentUser.targetLang,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        isOffline,
      };

      // Set user as speaking briefly
      setCurrentUser((prev) => ({ ...prev, isSpeaking: true }));
      setParticipants((prev) =>
        prev.map((p) => (p.isLocal ? { ...p, isSpeaking: true } : p))
      );
      setTimeout(() => {
        setCurrentUser((prev) => ({ ...prev, isSpeaking: false }));
        setParticipants((prev) =>
          prev.map((p) => (p.isLocal ? { ...p, isSpeaking: false } : p))
        );
      }, 900);

      // Handle locally
      setTranscripts((prev) => [...prev, transcriptItem]);
      setActiveSubtitle(transcriptItem);

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'speech_transcript',
            roomId,
            transcript: transcriptItem,
          })
        );

        if (isVirtualPartnerActive) {
          // Highlight Sarah as speaking/thinking
          setParticipants((prev) =>
            prev.map((p) => (p.id === 'virtual-partner' ? { ...p, isSpeaking: true } : p))
          );

          wsRef.current.send(
            JSON.stringify({
              type: 'virtual_partner_request',
              roomId,
              userText: text,
              userLang: getLanguageByCode(currentUser.spokenLang).name,
              partnerLang: 'English',
              partnerName: 'Sarah (Chicago, US)',
            })
          );
        }
      }
    } catch (e) {
      console.error('Error sending speech:', e);
    }
  };

  const handleLeaveCall = () => {
    speechService.stopListening();
    if (webrtcRef.current) {
      webrtcRef.current.closeAll();
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (currentUser.stream) {
      currentUser.stream.getTracks().forEach((t) => t.stop());
    }
    setInCall(false);
  };

  // If not yet in meeting call, display Google Meet Lobby
  if (!inCall) {
    return <Lobby initialRoomId={roomId} onJoinMeeting={handleJoinMeeting} />;
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-[#202124] overflow-hidden select-none">
      {/* Google Meet Header */}
      <MeetingHeader
        roomId={roomId}
        participants={participants}
        currentUser={currentUser}
        isOffline={isOffline}
        onOpenInvite={() => setActiveDrawer('invite')}
        onOpenParticipants={() => setActiveDrawer('people')}
      />

      {/* Main Video Call Grid & Drawers */}
      <div className="flex-1 flex overflow-hidden relative">
        <VideoGrid
          participants={participants}
          activeSubtitle={activeSubtitle}
          showCaptions={showCaptions}
          onSpeakSubtitle={(text, lang) => speechService.speakTranslatedText(text, lang, useGeminiTTS)}
          isDubbingActive={isDubbingActive}
          muteOriginalAudio={muteOriginalAudio}
          onSendUserSpeech={handleSendQuickSpeech}
          onTriggerSarahGreeting={triggerSarahGreeting}
          onToggleMuteOriginalAudio={() => setMuteOriginalAudio(!muteOriginalAudio)}
        />

        {/* Drawers */}
        {activeDrawer === 'invite' && (
          <InviteDrawer roomId={roomId} onClose={() => setActiveDrawer(null)} />
        )}
        {activeDrawer === 'people' && (
          <PeopleDrawer
            participants={participants}
            currentUser={currentUser}
            onClose={() => setActiveDrawer(null)}
          />
        )}
        {activeDrawer === 'transcript' && (
          <TranscriptDrawer
            transcripts={transcripts}
            roomId={roomId}
            onClose={() => setActiveDrawer(null)}
            onSpeakText={(text, lang) => speechService.speakTranslatedText(text, lang, useGeminiTTS)}
          />
        )}
      </div>

      {/* Google Meet Bottom Controls Bar */}
      <BottomControls
        currentUser={currentUser}
        participantCount={participants.length}
        showCaptions={showCaptions}
        isDubbingActive={isDubbingActive}
        isVirtualPartnerActive={isVirtualPartnerActive}
        isScreenSharing={isScreenSharing}
        muteOriginalAudio={muteOriginalAudio}
        activeDrawer={activeDrawer}
        onToggleMic={handleToggleMic}
        onToggleCamera={handleToggleCamera}
        onToggleCaptions={() => setShowCaptions(!showCaptions)}
        onToggleHand={handleToggleHand}
        onToggleDubbing={() => setIsDubbingActive(!isDubbingActive)}
        onToggleMuteOriginalAudio={() => setMuteOriginalAudio(!muteOriginalAudio)}
        onToggleVirtualPartner={handleToggleVirtualPartner}
        onOpenScreenShareModal={() => setIsScreenShareModalOpen(true)}
        onStopScreenShare={handleStopScreenShare}
        onOpenBackgroundModal={() => setIsBgModalOpen(true)}
        onToggleDrawer={(drawer) =>
          setActiveDrawer((prev) => (prev === drawer ? null : drawer))
        }
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDeviceModal={() => setIsDeviceModalOpen(true)}
        onOpenDocumentStudio={() => setIsDocumentStudioOpen(true)}
        onLeaveCall={handleLeaveCall}
        onSendQuickSpeech={handleSendQuickSpeech}
      />

      {/* Background Modal */}
      <BackgroundModal
        isOpen={isBgModalOpen}
        onClose={() => setIsBgModalOpen(false)}
        currentBackground={{
          type: currentUser.backgroundType || 'none',
          url: currentUser.backgroundUrl,
        }}
        onSelectBackground={handleSelectBackground}
        customBackgrounds={customBackgrounds}
        onAddCustomBackground={(url) => setCustomBackgrounds((prev) => [url, ...prev])}
      />

      {/* Screen Share Modal */}
      <ScreenShareModal
        isOpen={isScreenShareModalOpen}
        onClose={() => setIsScreenShareModalOpen(false)}
        onStartScreenShare={handleStartScreenShare}
      />

      {/* Document / PDF Real-Time Translation Modal */}
      <DocumentTranslationModal
        isOpen={isDocumentStudioOpen}
        onClose={() => setIsDocumentStudioOpen(false)}
        defaultTargetLang={currentUser.targetLang}
      />

      {/* Device Configuration & Testing Modal (Camera, Mic with VU-meter, Speakers with test sound) */}
      <DeviceModal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
        selectedCameraId={selectedCameraId}
        selectedMicId={selectedMicId}
        selectedSpeakerId={selectedSpeakerId}
        onSelectCamera={handleSelectCamera}
        onSelectMic={handleSelectMic}
        onSelectSpeaker={handleSelectSpeaker}
        activeStream={currentUser.stream}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        spokenLang={currentUser.spokenLang}
        targetLang={currentUser.targetLang}
        isDubbingActive={isDubbingActive}
        muteOriginalAudio={muteOriginalAudio}
        useGeminiTTS={useGeminiTTS}
        selectedVoice={selectedVoice}
        isOffline={isOffline}
        onOpenDeviceModal={() => setIsDeviceModalOpen(true)}
        onSpokenLangChange={(lang) => {
          setCurrentUser((p) => ({ ...p, spokenLang: lang }));
          setParticipants((prev) =>
            prev.map((p) => (p.isLocal ? { ...p, spokenLang: lang } : p))
          );
          speechService.setSpokenLanguage(lang);
          broadcastParticipantUpdate({ spokenLang: lang });
        }}
        onTargetLangChange={(lang) => {
          setCurrentUser((p) => ({ ...p, targetLang: lang }));
          setParticipants((prev) =>
            prev.map((p) => (p.isLocal ? { ...p, targetLang: lang } : p))
          );
          speechService.setTargetLanguage(lang);
          broadcastParticipantUpdate({ targetLang: lang });
        }}
        onDubbingToggle={(act) => setIsDubbingActive(act)}
        onMuteOriginalAudioToggle={(act) => setMuteOriginalAudio(act)}
        onUseGeminiTTSToggle={(gem) => setUseGeminiTTS(gem)}
        onSelectedVoiceChange={(voice) => setSelectedVoice(voice)}
        onOfflineToggle={(off) => setIsOffline(off)}
      />
    </div>
  );
}
