import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import socket from "../socket";
import api from "../api";
import "./Chat.css";

function Chat() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMessageNotice, setNewMessageNotice] = useState("");
  const [accessMessage, setAccessMessage] = useState("");
  const [accessChecked, setAccessChecked] = useState(false);

  const [callStarted, setCallStarted] = useState(false);
  const [showCallUI, setShowCallUI] = useState(false);
  const [callStatus, setCallStatus] = useState("Ready to start call");
  const [incomingCall, setIncomingCall] = useState(null);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [remoteStreamAvailable, setRemoteStreamAvailable] = useState(false);

  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user"));

  const messagesContainerRef = useRef(null);
  const previousMessageCountRef = useRef(0);
  const firstLoadRef = useRef(true);
  const originalTitleRef = useRef(document.title);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingOfferRef = useRef(null);
  const callContainerRef = useRef(null);
  const cameraTrackRef = useRef(null);
  const screenTrackRef = useRef(null);

  const audioContextRef = useRef(null);
  const outgoingToneIntervalRef = useRef(null);
  const incomingToneIntervalRef = useRef(null);

  const room = currentUser
    ? `call_${Math.min(currentUser.id, Number(userId))}_${Math.max(
        currentUser.id,
        Number(userId)
      )}`
    : "";

  const configuration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  const showBrowserNotification = (title, body) => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      new Notification(title, { body });
    }
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.error("Notification permission error:", error);
      }
    }
  };

  const ensureAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass();
      }
    }

    return audioContextRef.current;
  };

  const playBeep = (frequency = 700, duration = 220, volume = 0.04) => {
    try {
      const audioContext = ensureAudioContext();
      if (!audioContext) return;

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gainNode.gain.value = volume;

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.error("Audio beep error:", error);
    }
  };

  const stopOutgoingTone = () => {
    if (outgoingToneIntervalRef.current) {
      clearInterval(outgoingToneIntervalRef.current);
      outgoingToneIntervalRef.current = null;
    }
  };

  const stopIncomingRingtone = () => {
    if (incomingToneIntervalRef.current) {
      clearInterval(incomingToneIntervalRef.current);
      incomingToneIntervalRef.current = null;
    }
  };

  const startOutgoingTone = () => {
    stopOutgoingTone();
    playBeep(620, 180, 0.03);

    outgoingToneIntervalRef.current = setInterval(() => {
      playBeep(620, 180, 0.03);
    }, 1400);
  };

  const startIncomingRingtone = () => {
    stopIncomingRingtone();

    playBeep(900, 220, 0.04);
    setTimeout(() => playBeep(700, 220, 0.04), 260);

    incomingToneIntervalRef.current = setInterval(() => {
      playBeep(900, 220, 0.04);
      setTimeout(() => playBeep(700, 220, 0.04), 260);
    }, 1600);
  };

  const playNotificationSound = () => {
    playBeep(760, 150, 0.03);
  };

  const attachLocalStreamToVideo = () => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.play().catch(() => {});
    }
  };

  const attachRemoteStreamToVideo = (stream) => {
    if (remoteVideoRef.current && stream) {
      remoteVideoRef.current.srcObject = stream;
      remoteVideoRef.current.play().catch(() => {});
    }
  };

  const formatCallTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const resetCallState = () => {
    stopOutgoingTone();
    stopIncomingRingtone();

    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    cameraTrackRef.current = null;
    pendingOfferRef.current = null;

    setCallStarted(false);
    setShowCallUI(false);
    setIncomingCall(null);
    setIsMicOn(true);
    setIsCameraOn(true);
    setIsScreenSharing(false);
    setCallSeconds(0);
    setRemoteStreamAvailable(false);

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const showAccessDeniedAndRedirect = (
    message = "You can only chat with matched users."
  ) => {
    setAccessMessage(message);
    setLoading(false);

    setTimeout(() => {
      navigate("/matches");
    }, 1600);
  };

  const verifyMatchedAccess = async () => {
    try {
      const res = await api.get("/api/matches");
      const foundUser = (res.data || []).find((u) => String(u.id) === String(userId));

      if (!foundUser) {
        setAccessChecked(true);
        showAccessDeniedAndRedirect("Chat access denied. You are not matched with this user.");
        return false;
      }

      setOtherUser(foundUser);
      setAccessChecked(true);
      return true;
    } catch (error) {
      console.error("Failed to verify chat access:", error.response?.data || error.message);
      setAccessChecked(true);
      showAccessDeniedAndRedirect("Could not verify chat access.");
      return false;
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/api/messages/${userId}`);
      const newMessages = res.data || [];

      if (!firstLoadRef.current && newMessages.length > previousMessageCountRef.current) {
        const latestMessage = newMessages[newMessages.length - 1];

        if (Number(latestMessage.sender_id) !== Number(currentUser?.id)) {
          setNewMessageNotice("New message received");
          document.title = "(1) New message";
          playNotificationSound();

          if (document.hidden) {
            showBrowserNotification(
              otherUser?.name || "New message",
              latestMessage.message_text || "You have a new message"
            );
          }

          setTimeout(() => {
            setNewMessageNotice("");
            document.title = originalTitleRef.current;
          }, 3000);
        }
      }

      previousMessageCountRef.current = newMessages.length;
      firstLoadRef.current = false;
      setMessages(newMessages);
    } catch (error) {
      console.error("Failed to fetch messages:", error.response?.data || error.message);

      if (error.response?.status === 403) {
        showAccessDeniedAndRedirect("Chat access denied. You are not matched with this user.");
      }
    } finally {
      setLoading(false);
    }
  };

  const createPeerConnection = () => {
    const peerConnection = new RTCPeerConnection(configuration);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          room,
          candidate: event.candidate,
        });
      }
    };

    peerConnection.ontrack = (event) => {
      attachRemoteStreamToVideo(event.streams[0]);
      setRemoteStreamAvailable(true);
      setCallStatus("Connected");
      stopOutgoingTone();
      stopIncomingRingtone();
    };

    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;

      if (state === "connected") {
        setCallStatus("Connected");
        stopOutgoingTone();
        stopIncomingRingtone();
      } else if (state === "connecting") {
        setCallStatus("Connecting...");
      } else if (state === "disconnected") {
        setCallStatus("Connection lost");
      } else if (state === "failed") {
        setCallStatus("Call failed");
        stopOutgoingTone();
        stopIncomingRingtone();
      } else if (state === "closed") {
        setCallStatus("Call ended");
      }
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  };

  const startLocalMedia = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localStreamRef.current = stream;

    const firstVideoTrack = stream.getVideoTracks()[0];
    if (firstVideoTrack) {
      cameraTrackRef.current = firstVideoTrack;
    }

    setShowCallUI(true);
    setIsMicOn(true);
    setIsCameraOn(true);
    setIsScreenSharing(false);
    setRemoteStreamAvailable(false);

    setTimeout(() => {
      attachLocalStreamToVideo();
    }, 150);

    return stream;
  };

  const startCall = async () => {
    try {
      if (callStarted || !otherUser) return;

      setCallStatus("Starting call...");
      setCallSeconds(0);
      setRemoteStreamAvailable(false);

      const stream = await startLocalMedia();
      const peerConnection = createPeerConnection();

      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      socket.emit("incoming-call", {
        room,
        caller_name: currentUser?.name || "User",
        offer,
      });

      setCallStarted(true);
      setShowCallUI(true);
      setCallStatus("Calling...");
      startOutgoingTone();
    } catch (error) {
      console.error("Call start error:", error);
      setCallStatus("Failed to start call");
      stopOutgoingTone();
      setAccessMessage("Could not access camera or microphone.");
      setTimeout(() => setAccessMessage(""), 2500);
    }
  };

  const acceptCall = async () => {
    try {
      stopIncomingRingtone();
      setIncomingCall(null);
      setCallStatus("Connecting...");
      setCallSeconds(0);
      setRemoteStreamAvailable(false);

      const stream = await startLocalMedia();
      let peerConnection = peerConnectionRef.current;

      if (!peerConnection) {
        peerConnection = createPeerConnection();
      }

      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(pendingOfferRef.current)
      );

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      socket.emit("accept-call", {
        room,
        answer,
      });

      setCallStarted(true);
      setShowCallUI(true);
      setCallStatus("Connected");
    } catch (error) {
      console.error("Accept call error:", error);
      setCallStatus("Failed to accept call");
    }
  };

  const rejectCall = () => {
    stopIncomingRingtone();

    socket.emit("reject-call", {
      room,
      user_name: currentUser?.name || "User",
    });

    pendingOfferRef.current = null;
    setIncomingCall(null);
    setCallStatus("Call rejected");
  };

  const replaceVideoTrack = async (newTrack) => {
    const peerConnection = peerConnectionRef.current;
    if (!peerConnection) return;

    const sender = peerConnection
      .getSenders()
      .find((item) => item.track && item.track.kind === "video");

    if (sender) {
      await sender.replaceTrack(newTrack);
    }
  };

  const restoreCameraAfterScreenShare = async () => {
    try {
      if (!cameraTrackRef.current || !localStreamRef.current) return;

      await replaceVideoTrack(cameraTrackRef.current);

      const currentVideoTracks = localStreamRef.current.getVideoTracks();
      currentVideoTracks.forEach((track) => {
        if (track !== cameraTrackRef.current) {
          track.stop();
          localStreamRef.current.removeTrack(track);
        }
      });

      const hasCameraTrack = localStreamRef.current
        .getVideoTracks()
        .includes(cameraTrackRef.current);

      if (!hasCameraTrack) {
        localStreamRef.current.addTrack(cameraTrackRef.current);
      }

      attachLocalStreamToVideo();
      setIsScreenSharing(false);
      setIsCameraOn(cameraTrackRef.current.enabled);
    } catch (error) {
      console.error("Restore camera error:", error);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!callStarted || !localStreamRef.current) return;

      if (isScreenSharing) {
        if (screenTrackRef.current) {
          screenTrackRef.current.stop();
        }
        await restoreCameraAfterScreenShare();
        return;
      }

      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      const displayTrack = displayStream.getVideoTracks()[0];
      if (!displayTrack) return;

      screenTrackRef.current = displayTrack;

      displayTrack.onended = async () => {
        screenTrackRef.current = null;
        await restoreCameraAfterScreenShare();
      };

      await replaceVideoTrack(displayTrack);

      if (localStreamRef.current && cameraTrackRef.current) {
        const oldVideoTracks = localStreamRef.current.getVideoTracks();
        oldVideoTracks.forEach((track) => {
          if (track !== cameraTrackRef.current) {
            localStreamRef.current.removeTrack(track);
          }
        });

        const stream = localStreamRef.current;
        if (!stream.getVideoTracks().includes(displayTrack)) {
          stream.addTrack(displayTrack);
        }
      }

      attachLocalStreamToVideo();
      setIsScreenSharing(true);
    } catch (error) {
      console.error("Screen share error:", error);
    }
  };

  const endCall = (emitLeave = true) => {
    if (emitLeave) {
      socket.emit("leave-call", {
        room,
        user_name: currentUser?.name || "User",
      });
    }

    resetCallState();
    setCallStatus("Call ended");
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    let interval;

    const handleUserJoined = () => {
      setCallStatus("User is available");
    };

    const handleIncomingCall = (data) => {
      pendingOfferRef.current = data.offer;
      setIncomingCall({
        callerName: data.caller_name,
      });
      setCallStatus(`${data.caller_name} is calling...`);
      startIncomingRingtone();

      if (document.hidden) {
        showBrowserNotification(
          "Incoming video call",
          `${data.caller_name} is calling you`
        );
      }
    };

    const handleCallAccepted = async (data) => {
      try {
        stopOutgoingTone();

        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
          setCallStatus("Connected");
        }
      } catch (error) {
        console.error("Answer handling error:", error);
      }
    };

    const handleCallRejected = (data) => {
      stopOutgoingTone();
      setCallStatus(`${data.user_name} rejected the call`);
      endCall(false);
    };

    const handleIceCandidate = async (data) => {
      try {
        if (peerConnectionRef.current && data.candidate) {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        }
      } catch (error) {
        console.error("ICE candidate error:", error);
      }
    };

    const handleUserLeft = () => {
      resetCallState();
      setCallStatus("Other user left the call");
    };

    const initializeChat = async () => {
      if (!token || !currentUser) {
        navigate("/login");
        return;
      }

      requestNotificationPermission();

      const isAllowed = await verifyMatchedAccess();
      if (!isAllowed) return;

      await fetchMessages();

      socket.emit("join-call", {
        room,
        user_name: currentUser?.name || "User",
      });

      interval = setInterval(() => {
        fetchMessages();
      }, 2000);

      socket.off("user-joined", handleUserJoined);
      socket.on("user-joined", handleUserJoined);

      socket.off("incoming-call", handleIncomingCall);
      socket.on("incoming-call", handleIncomingCall);

      socket.off("call-accepted", handleCallAccepted);
      socket.on("call-accepted", handleCallAccepted);

      socket.off("call-rejected", handleCallRejected);
      socket.on("call-rejected", handleCallRejected);

      socket.off("ice-candidate", handleIceCandidate);
      socket.on("ice-candidate", handleIceCandidate);

      socket.off("user-left", handleUserLeft);
      socket.on("user-left", handleUserLeft);
    };

    initializeChat();

    return () => {
      if (interval) {
        clearInterval(interval);
      }

      document.title = originalTitleRef.current;

      socket.emit("leave-call", {
        room,
        user_name: currentUser?.name || "User",
      });

      socket.off("user-joined", handleUserJoined);
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("call-rejected", handleCallRejected);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("user-left", handleUserLeft);

      resetCallState();
    };
  }, [userId, navigate, room, token]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    attachLocalStreamToVideo();
  }, [showCallUI]);

  useEffect(() => {
    let interval;

    if (callStarted && showCallUI) {
      interval = setInterval(() => {
        setCallSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callStarted, showCallUI]);

  useEffect(() => {
    if (!accessMessage) return;

    const timeout = setTimeout(() => {
      setAccessMessage("");
    }, 2200);

    return () => clearTimeout(timeout);
  }, [accessMessage]);

  const handleSend = async (e) => {
    e.preventDefault();

    if (!messageText.trim()) return;
    if (!otherUser) return;

    try {
      await api.post("/api/messages", {
        receiver_id: userId,
        message_text: messageText,
      });

      setMessageText("");
      fetchMessages();
    } catch (error) {
      console.error("Failed to send message:", error.response?.data || error.message);

      if (error.response?.status === 403) {
        showAccessDeniedAndRedirect("Chat access denied. You are not matched with this user.");
        return;
      }

      setAccessMessage(error.response?.data?.message || "Failed to send message");
    }
  };

  if (!accessChecked && loading) {
    return (
      <>
        <Navbar />
        <div className="chat-page">
          <div className="chat-shell">
            <div className="chat-messages">
              <p className="chat-empty">Checking chat access...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      {accessMessage && <div className="chat-access-toast">{accessMessage}</div>}

      {incomingCall && (
        <div className="incoming-call-modal">
          <div className="incoming-call-card">
            <div className="incoming-call-avatar">
              {(incomingCall.callerName || "U").charAt(0).toUpperCase()}
            </div>
            <h2 className="incoming-call-title">{incomingCall.callerName}</h2>
            <p className="incoming-call-subtitle">Incoming video call...</p>

            <div className="incoming-call-big-actions">
              <button
                type="button"
                onClick={acceptCall}
                className="incoming-circle-btn incoming-accept-btn"
                title="Accept"
              >
                📞
              </button>

              <button
                type="button"
                onClick={rejectCall}
                className="incoming-circle-btn incoming-reject-btn"
                title="Reject"
              >
                ✖
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="chat-page">
        <div className="chat-shell">
          <div className="chat-header">
            <div className="chat-header-left">
              <h2>Chat with {otherUser?.name || "Matched User"}</h2>
              <p className="chat-status">{callStatus}</p>
            </div>

            <div className="chat-header-actions">
              <button
                type="button"
                onClick={startCall}
                disabled={callStarted || !otherUser}
                className="chat-btn chat-btn-start"
              >
                Start Video Call
              </button>

              <button
                type="button"
                onClick={endCall}
                disabled={!showCallUI && !callStarted}
                className="chat-btn chat-btn-end"
              >
                End Call
              </button>

              <button
                type="button"
                onClick={() => navigate("/matches")}
                className="chat-btn chat-btn-back"
              >
                Back to Matches
              </button>
            </div>
          </div>

          {showCallUI && (
            <div ref={callContainerRef} className="call-wrapper">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="call-remote-video"
              />

              {!remoteStreamAvailable && (
                <div className="call-waiting">
                  Waiting for {otherUser?.name || "other user"} to join...
                </div>
              )}

              <div className="call-timer">
                ⏱ {callStarted ? formatCallTime(callSeconds) : "Connecting..."}
              </div>

              {isScreenSharing && (
                <div className="screen-share-badge">🖥 Sharing Screen</div>
              )}

              <div className="call-local-video-box">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`call-local-video ${
                    !isCameraOn ? "call-local-video-off" : ""
                  }`}
                />

                {!isCameraOn && (
                  <div className="call-camera-off-overlay">Camera Off</div>
                )}
              </div>

              <div className="call-controls">
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`call-control-btn ${
                    isMicOn ? "call-control-mic-on" : "call-control-mic-off"
                  }`}
                  title={isMicOn ? "Mute Mic" : "Unmute Mic"}
                >
                  {isMicOn ? "🎤" : "🔇"}
                </button>

                <button
                  type="button"
                  onClick={toggleCamera}
                  className={`call-control-btn ${
                    isCameraOn
                      ? "call-control-camera-on"
                      : "call-control-camera-off"
                  }`}
                  title={isCameraOn ? "Turn Camera Off" : "Turn Camera On"}
                >
                  {isCameraOn ? "📷" : "🚫"}
                </button>

                <button
                  type="button"
                  onClick={toggleScreenShare}
                  className={`call-control-btn ${
                    isScreenSharing
                      ? "call-control-screen-on"
                      : "call-control-screen-off"
                  }`}
                  title={isScreenSharing ? "Stop Screen Share" : "Start Screen Share"}
                >
                  🖥
                </button>

                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="call-control-btn call-control-fullscreen"
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? "🗗" : "⛶"}
                </button>

                <button
                  type="button"
                  onClick={endCall}
                  className="call-control-btn call-control-end"
                  title="End Call"
                >
                  📞
                </button>
              </div>
            </div>
          )}

          {newMessageNotice && <div className="chat-notice">{newMessageNotice}</div>}

          <div ref={messagesContainerRef} className="chat-messages">
            {loading ? (
              <p className="chat-empty">Loading messages...</p>
            ) : messages.length === 0 ? (
              <p className="chat-empty">No messages yet. Start the conversation.</p>
            ) : (
              messages.map((msg) => {
                const isMine = Number(msg.sender_id) === Number(currentUser?.id);

                return (
                  <div
                    key={msg.id}
                    className={`chat-message-row ${isMine ? "mine" : "other"}`}
                  >
                    <div className={`chat-bubble ${isMine ? "mine" : "other"}`}>
                      <p className="chat-message-text">{msg.message_text}</p>
                      <small className="chat-message-time">
                        {new Date(msg.created_at).toLocaleString()}
                      </small>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleSend} className="chat-form">
            <input
              type="text"
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="chat-input"
              disabled={!otherUser}
            />

            <button
              type="submit"
              className="chat-send-btn"
              disabled={!otherUser || !messageText.trim()}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default Chat;