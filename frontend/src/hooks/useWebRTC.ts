"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Participant, ChatMessage } from "@/types";

interface UseWebRTCOptions {
  lectureId: string;
  userEmail: string;
  userRole: "INSTRUCTOR" | "STUDENT";
  userName: string;
  onError?: (error: string) => void;
}

interface PeerConnection {
  sessionId: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export function useWebRTC({
  lectureId,
  userEmail,
  userRole,
  userName,
  onError,
}: UseWebRTCOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const mySessionIdRef = useRef<string | null>(null);

  // Create peer connection for a participant
  const createPeerConnection = useCallback((targetSessionId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Add screen share stream if active
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, screenStreamRef.current!);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "ice-candidate",
          targetSessionId,
          candidate: event.candidate,
        }));
      }
    };

    // Handle incoming tracks
    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        setRemoteStreams((prev) => {
          const newMap = new Map(prev);
          newMap.set(targetSessionId, stream);
          return newMap;
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state for ${targetSessionId}:`, pc.connectionState);
    };

    peerConnectionsRef.current.set(targetSessionId, {
      sessionId: targetSessionId,
      connection: pc,
    });

    return pc;
  }, []);

  // Initialize local media
  const initializeMedia = useCallback(async (video = true, audio = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: 1280, height: 720, facingMode: "user" } : false,
        audio: audio ? { echoCancellation: true, noiseSuppression: true } : false,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      onError?.("Failed to access camera/microphone. Please check permissions.");
      return null;
    }
  }, [onError]);

  // Start screen sharing
  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" } as MediaTrackConstraints,
        audio: true,
      });
      
      screenStreamRef.current = stream;
      setScreenStream(stream);
      setIsScreenSharing(true);

      // Add screen tracks to all peer connections
      peerConnectionsRef.current.forEach(({ connection }) => {
        stream.getTracks().forEach((track) => {
          connection.addTrack(track, stream);
        });
      });

      // Notify others
      wsRef.current?.send(JSON.stringify({ type: "screen-share-start" }));

      // Handle when user stops sharing via browser UI
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      return stream;
    } catch (error) {
      console.error("Error starting screen share:", error);
      onError?.("Failed to start screen sharing");
      return null;
    }
  }, [onError]);

  // Stop screen sharing
  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
      setScreenStream(null);
      setIsScreenSharing(false);
      wsRef.current?.send(JSON.stringify({ type: "screen-share-stop" }));
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff((prev) => !prev);
    }
  }, []);

  // Send chat message
  const sendChatMessage = useCallback((message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "chat",
        message,
      }));
    }
  }, []);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback(async (event: MessageEvent) => {
    const data = JSON.parse(event.data);
    console.log("WebSocket message:", data.type);

    switch (data.type) {
      case "participants": {
        setParticipants(data.participants);
        break;
      }

      case "user-joined": {
        setParticipants((prev) => {
          if (prev.some((p) => p.sessionId === data.sessionId)) return prev;
          return [...prev, {
            sessionId: data.sessionId,
            email: data.email,
            role: data.role,
            name: data.name,
          }];
        });
        break;
      }

      case "user-left": {
        setParticipants((prev) => prev.filter((p) => p.sessionId !== data.sessionId));
        setRemoteStreams((prev) => {
          const newMap = new Map(prev);
          newMap.delete(data.sessionId);
          return newMap;
        });
        const pc = peerConnectionsRef.current.get(data.sessionId);
        if (pc) {
          pc.connection.close();
          peerConnectionsRef.current.delete(data.sessionId);
        }
        break;
      }

      case "create-offer": {
        // Instructor receives this when a student joins
        const pc = createPeerConnection(data.targetSessionId);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          wsRef.current?.send(JSON.stringify({
            type: "offer",
            targetSessionId: data.targetSessionId,
            offer: pc.localDescription,
          }));
        } catch (error) {
          console.error("Error creating offer:", error);
        }
        break;
      }

      case "offer": {
        // Student receives offer from instructor
        const pc = createPeerConnection(data.fromSessionId);
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          wsRef.current?.send(JSON.stringify({
            type: "answer",
            targetSessionId: data.fromSessionId,
            answer: pc.localDescription,
          }));
        } catch (error) {
          console.error("Error handling offer:", error);
        }
        break;
      }

      case "answer": {
        const pc = peerConnectionsRef.current.get(data.fromSessionId);
        if (pc) {
          try {
            await pc.connection.setRemoteDescription(new RTCSessionDescription(data.answer));
          } catch (error) {
            console.error("Error setting remote description:", error);
          }
        }
        break;
      }

      case "ice-candidate": {
        const pc = peerConnectionsRef.current.get(data.fromSessionId);
        if (pc && data.candidate) {
          try {
            await pc.connection.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (error) {
            console.error("Error adding ICE candidate:", error);
          }
        }
        break;
      }

      case "chat": {
        setChatMessages((prev) => [...prev, {
          fromSessionId: data.fromSessionId,
          fromEmail: data.fromEmail,
          fromName: data.fromName,
          fromRole: data.fromRole,
          message: data.message,
          timestamp: data.timestamp,
        }]);
        break;
      }

      case "screen-share-started":
      case "screen-share-stopped":
        // Handle UI updates for screen sharing state
        break;
    }
  }, [createPeerConnection]);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    // Don't connect if already connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected");
      return;
    }

    // Initialize media first (only video for instructor)
    try {
      await initializeMedia(userRole === "INSTRUCTOR", true);
    } catch (err) {
      console.warn("Media initialization failed, continuing without media:", err);
    }

    const wsUrl = `ws://localhost:8080/ws/lecture/${lectureId}`;
    console.log("Connecting to WebSocket:", wsUrl);
    
    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connected successfully");
        setIsConnected(true);
        
        // Send join message
        ws.send(JSON.stringify({
          type: "join",
          lectureId,
          email: userEmail,
          role: userRole,
          name: userName,
        }));
      };

      ws.onmessage = handleWebSocketMessage;

      ws.onerror = (event) => {
        console.error("WebSocket error event:", event);
        // Don't show error if we're just connecting - wait for close event
      };

      ws.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason);
        setIsConnected(false);
        
        // Only show error for abnormal closures
        if (event.code !== 1000 && event.code !== 1001) {
          onError?.(`Connection closed: ${event.reason || 'Unable to connect to lecture room'}`);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("Failed to create WebSocket:", err);
      onError?.("Failed to connect to lecture room");
    }
  }, [lectureId, userEmail, userRole, userName, initializeMedia, handleWebSocketMessage, onError]);

  // Disconnect
  const disconnect = useCallback(() => {
    // Close all peer connections
    peerConnectionsRef.current.forEach(({ connection }) => {
      connection.close();
    });
    peerConnectionsRef.current.clear();

    // Stop all media
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    screenStreamRef.current = null;
    setLocalStream(null);
    setScreenStream(null);

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: "leave" }));
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setParticipants([]);
    setRemoteStreams(new Map());
    setChatMessages([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    participants,
    chatMessages,
    localStream,
    screenStream,
    remoteStreams,
    isScreenSharing,
    isMuted,
    isVideoOff,
    connect,
    disconnect,
    startScreenShare,
    stopScreenShare,
    toggleMute,
    toggleVideo,
    sendChatMessage,
  };
}
