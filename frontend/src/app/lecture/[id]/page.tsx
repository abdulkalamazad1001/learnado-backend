"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useWebRTC } from "@/hooks/useWebRTC";
import { Button } from "@/components/ui";
import type { LiveLecture, Participant, ChatMessage } from "@/types";
import styles from "./room.module.css";

export default function LectureRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const lectureId = params.id as string;

  const [lecture, setLecture] = useState<LiveLecture | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const {
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
  } = useWebRTC({
    lectureId,
    userEmail: user?.email || "",
    userRole: user?.role === "INSTRUCTOR" ? "INSTRUCTOR" : "STUDENT",
    userName: user?.email?.split("@")[0] || "Anonymous",
    onError: setError,
  });

  // Fetch lecture details
  useEffect(() => {
    const fetchLecture = async () => {
      try {
        const data = await api.getLecture(lectureId);
        setLecture(data);
        
        if (data.status !== "LIVE") {
          setError("This lecture is not currently live");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load lecture");
      } finally {
        setIsLoading(false);
      }
    };

    if (lectureId) {
      fetchLecture();
    }
  }, [lectureId]);

  // Connect to room when lecture is loaded and live
  useEffect(() => {
    if (lecture?.status === "LIVE" && user && !isConnected) {
      connect();
    }
  }, [lecture?.status, user, isConnected, connect]);

  // Set local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Set screen share stream
  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Handle leaving the room
  const handleLeave = async () => {
    disconnect();
    router.push("/dashboard");
  };

  // Handle ending the lecture (instructor only)
  const handleEndLecture = async () => {
    if (!lecture) return;
    try {
      await api.endLecture(lecture.id);
      disconnect();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to end lecture");
    }
  };

  // Send chat message
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendChatMessage(chatInput);
      setChatInput("");
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.spinner} />
        <p>Loading lecture room...</p>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  if (error && !lecture) {
    return (
      <div className={styles.errorPage}>
        <h2>Unable to Join Lecture</h2>
        <p>{error}</p>
        <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  const isInstructor = user.role === "INSTRUCTOR" && lecture?.instructorEmail === user.email;

  return (
    <div className={styles.roomContainer}>
      {/* Main video area */}
      <div className={styles.mainArea}>
        {/* Top bar */}
        <div className={styles.topBar}>
          <div className={styles.lectureInfo}>
            <h1 className={styles.lectureTitle}>{lecture?.title}</h1>
            <span className={styles.participantCount}>
              {participants.length + 1} participants
            </span>
          </div>
          <div className={styles.connectionStatus}>
            <span className={`${styles.statusDot} ${isConnected ? styles.connected : styles.disconnected}`} />
            {isConnected ? "Connected" : "Connecting..."}
          </div>
        </div>

        {/* Video grid */}
        <div className={styles.videoGrid}>
          {/* Screen share (if active) */}
          {isScreenSharing && screenStream && (
            <div className={styles.screenShareContainer}>
              <video
                ref={screenVideoRef}
                autoPlay
                playsInline
                muted
                className={styles.screenVideo}
              />
              <div className={styles.screenLabel}>Screen Share</div>
            </div>
          )}

          {/* Instructor video (main or sidebar based on screen share) */}
          <div className={`${styles.videoContainer} ${isScreenSharing ? styles.smallVideo : styles.mainVideo}`}>
            {isInstructor ? (
              <>
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={styles.video}
                />
                <div className={styles.videoLabel}>
                  You (Instructor)
                  {isMuted && <span className={styles.mutedIcon}>🔇</span>}
                </div>
              </>
            ) : (
              // Find instructor stream from remote streams
              (() => {
                const instructorParticipant = participants.find(p => p.role === "INSTRUCTOR");
                const instructorStream = instructorParticipant ? remoteStreams.get(instructorParticipant.sessionId) : null;
                
                return instructorStream ? (
                  <>
                    <VideoPlayer stream={instructorStream} />
                    <div className={styles.videoLabel}>
                      {instructorParticipant?.name || "Instructor"}
                    </div>
                  </>
                ) : (
                  <div className={styles.noVideo}>
                    <span>👨‍🏫</span>
                    <p>Waiting for instructor...</p>
                  </div>
                );
              })()
            )}
          </div>

          {/* Student videos (small grid) */}
          {!isInstructor && localStream && (
            <div className={styles.smallVideo}>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={styles.video}
              />
              <div className={styles.videoLabel}>
                You
                {isMuted && <span className={styles.mutedIcon}>🔇</span>}
              </div>
            </div>
          )}

          {/* Remote participant videos (students if instructor, other students if student) */}
          {Array.from(remoteStreams.entries())
            .filter(([sessionId]) => {
              const participant = participants.find(p => p.sessionId === sessionId);
              // Instructor sees students, students see other students (not instructor - shown in main)
              if (isInstructor) return participant?.role === "STUDENT";
              return participant?.role === "STUDENT";
            })
            .slice(0, 8) // Limit visible videos
            .map(([sessionId, stream]) => {
              const participant = participants.find(p => p.sessionId === sessionId);
              return (
                <div key={sessionId} className={styles.smallVideo}>
                  <VideoPlayer stream={stream} />
                  <div className={styles.videoLabel}>
                    {participant?.name || "Participant"}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <button
            className={`${styles.controlButton} ${isMuted ? styles.controlButtonActive : ""}`}
            onClick={toggleMute}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? "🔇" : "🎤"}
          </button>

          <button
            className={`${styles.controlButton} ${isVideoOff ? styles.controlButtonActive : ""}`}
            onClick={toggleVideo}
            title={isVideoOff ? "Turn on camera" : "Turn off camera"}
          >
            {isVideoOff ? "📷" : "🎥"}
          </button>

          {isInstructor && (
            <button
              className={`${styles.controlButton} ${isScreenSharing ? styles.controlButtonActive : ""}`}
              onClick={isScreenSharing ? stopScreenShare : startScreenShare}
              title={isScreenSharing ? "Stop sharing" : "Share screen"}
            >
              {isScreenSharing ? "🖥️" : "💻"}
            </button>
          )}

          <button
            className={styles.controlButton}
            onClick={() => setShowChat(!showChat)}
            title="Toggle chat"
          >
            💬
          </button>

          <button
            className={styles.controlButton}
            onClick={() => setShowParticipants(!showParticipants)}
            title="Toggle participants"
          >
            👥
          </button>

          <button
            className={`${styles.controlButton} ${styles.leaveButton}`}
            onClick={isInstructor ? handleEndLecture : handleLeave}
            title={isInstructor ? "End lecture" : "Leave lecture"}
          >
            {isInstructor ? "End" : "Leave"}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      {(showChat || showParticipants) && (
        <div className={styles.sidebar}>
          {/* Tabs */}
          <div className={styles.sidebarTabs}>
            <button
              className={`${styles.sidebarTab} ${showChat && !showParticipants ? styles.sidebarTabActive : ""}`}
              onClick={() => { setShowChat(true); setShowParticipants(false); }}
            >
              Chat
            </button>
            <button
              className={`${styles.sidebarTab} ${showParticipants ? styles.sidebarTabActive : ""}`}
              onClick={() => { setShowParticipants(true); setShowChat(false); }}
            >
              Participants ({participants.length + 1})
            </button>
          </div>

          {/* Chat panel */}
          {showChat && !showParticipants && (
            <div className={styles.chatPanel}>
              <div className={styles.chatMessages}>
                {chatMessages.map((msg, i) => (
                  <div
                    key={`${msg.fromSessionId}-${msg.timestamp}-${i}`}
                    className={`${styles.chatMessage} ${msg.fromEmail === user.email ? styles.ownMessage : ""}`}
                  >
                    <div className={styles.chatMessageHeader}>
                      <span className={styles.chatSender}>
                        {msg.fromEmail === user.email ? "You" : msg.fromName}
                      </span>
                      {msg.fromRole === "INSTRUCTOR" && (
                        <span className={styles.instructorBadge}>Instructor</span>
                      )}
                      <span className={styles.chatTime}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className={styles.chatText}>{msg.message}</p>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSendChat} className={styles.chatInput}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className={styles.chatInputField}
                />
                <button type="submit" className={styles.chatSendButton}>
                  Send
                </button>
              </form>
            </div>
          )}

          {/* Participants panel */}
          {showParticipants && (
            <div className={styles.participantsPanel}>
              {/* Current user */}
              <div className={styles.participant}>
                <div className={styles.participantAvatar}>
                  {user.email[0].toUpperCase()}
                </div>
                <div className={styles.participantInfo}>
                  <span className={styles.participantName}>You</span>
                  <span className={styles.participantRole}>
                    {isInstructor ? "Instructor" : "Student"}
                  </span>
                </div>
              </div>

              {/* Other participants */}
              {participants.map((p) => (
                <div key={p.sessionId} className={styles.participant}>
                  <div className={styles.participantAvatar}>
                    {p.name[0].toUpperCase()}
                  </div>
                  <div className={styles.participantInfo}>
                    <span className={styles.participantName}>{p.name}</span>
                    <span className={styles.participantRole}>
                      {p.role === "INSTRUCTOR" ? "Instructor" : "Student"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className={styles.errorToast}>
          {error}
          <button onClick={() => setError("")}>×</button>
        </div>
      )}
    </div>
  );
}

// Video player component for remote streams
function VideoPlayer({ stream }: { stream: MediaStream }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className={styles.video}
    />
  );
}
