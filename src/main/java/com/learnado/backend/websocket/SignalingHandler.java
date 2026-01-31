package com.learnado.backend.websocket;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class SignalingHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // Map: lectureId -> Set of sessions in that lecture room
    private final Map<String, Set<WebSocketSession>> lectureRooms = new ConcurrentHashMap<>();
    
    // Map: sessionId -> participant info (lectureId, email, role, name)
    private final Map<String, ParticipantInfo> sessionInfo = new ConcurrentHashMap<>();
    
    // Map: lectureId -> instructor session (only one instructor per room)
    private final Map<String, WebSocketSession> instructorSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        log.info("WebSocket connection established: {}", session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        JsonNode json = objectMapper.readTree(message.getPayload());
        String type = json.get("type").asText();
        
        log.info("Received message type: {} from session: {}", type, session.getId());

        switch (type) {
            case "join" -> handleJoin(session, json);
            case "offer" -> handleOffer(session, json);
            case "answer" -> handleAnswer(session, json);
            case "ice-candidate" -> handleIceCandidate(session, json);
            case "screen-share-start" -> handleScreenShareStart(session, json);
            case "screen-share-stop" -> handleScreenShareStop(session, json);
            case "chat" -> handleChat(session, json);
            case "leave" -> handleLeave(session);
            default -> log.warn("Unknown message type: {}", type);
        }
    }

    private void handleJoin(WebSocketSession session, JsonNode json) throws IOException {
        String lectureId = json.get("lectureId").asText();
        String email = json.get("email").asText();
        String role = json.get("role").asText(); // INSTRUCTOR or STUDENT
        String name = json.has("name") ? json.get("name").asText() : email;

        ParticipantInfo info = new ParticipantInfo(lectureId, email, role, name);
        sessionInfo.put(session.getId(), info);

        // Add to room
        lectureRooms.computeIfAbsent(lectureId, k -> ConcurrentHashMap.newKeySet()).add(session);

        // Track instructor session
        if ("INSTRUCTOR".equals(role)) {
            instructorSessions.put(lectureId, session);
        }

        // Notify others in the room
        ObjectNode joinNotification = objectMapper.createObjectNode();
        joinNotification.put("type", "user-joined");
        joinNotification.put("sessionId", session.getId());
        joinNotification.put("email", email);
        joinNotification.put("role", role);
        joinNotification.put("name", name);
        
        broadcastToRoom(lectureId, joinNotification.toString(), session);

        // Send current participants list to the new joiner
        sendParticipantsList(session, lectureId);
        
        // If this is a student and instructor is present, notify them to create offer
        if ("STUDENT".equals(role)) {
            WebSocketSession instructorSession = instructorSessions.get(lectureId);
            if (instructorSession != null && instructorSession.isOpen()) {
                ObjectNode requestOffer = objectMapper.createObjectNode();
                requestOffer.put("type", "create-offer");
                requestOffer.put("targetSessionId", session.getId());
                requestOffer.put("studentEmail", email);
                requestOffer.put("studentName", name);
                instructorSession.sendMessage(new TextMessage(requestOffer.toString()));
            }
        }

        log.info("User {} joined lecture {} as {}", email, lectureId, role);
    }

    private void handleOffer(WebSocketSession session, JsonNode json) throws IOException {
        String targetSessionId = json.get("targetSessionId").asText();
        ParticipantInfo senderInfo = sessionInfo.get(session.getId());
        
        if (senderInfo == null) return;

        // Find target session
        Set<WebSocketSession> room = lectureRooms.get(senderInfo.lectureId);
        if (room == null) return;

        for (WebSocketSession targetSession : room) {
            if (targetSession.getId().equals(targetSessionId) && targetSession.isOpen()) {
                ObjectNode offerMessage = objectMapper.createObjectNode();
                offerMessage.put("type", "offer");
                offerMessage.put("fromSessionId", session.getId());
                offerMessage.put("fromEmail", senderInfo.email);
                offerMessage.put("fromRole", senderInfo.role);
                offerMessage.set("offer", json.get("offer"));
                targetSession.sendMessage(new TextMessage(offerMessage.toString()));
                break;
            }
        }
    }

    private void handleAnswer(WebSocketSession session, JsonNode json) throws IOException {
        String targetSessionId = json.get("targetSessionId").asText();
        ParticipantInfo senderInfo = sessionInfo.get(session.getId());
        
        if (senderInfo == null) return;

        Set<WebSocketSession> room = lectureRooms.get(senderInfo.lectureId);
        if (room == null) return;

        for (WebSocketSession targetSession : room) {
            if (targetSession.getId().equals(targetSessionId) && targetSession.isOpen()) {
                ObjectNode answerMessage = objectMapper.createObjectNode();
                answerMessage.put("type", "answer");
                answerMessage.put("fromSessionId", session.getId());
                answerMessage.set("answer", json.get("answer"));
                targetSession.sendMessage(new TextMessage(answerMessage.toString()));
                break;
            }
        }
    }

    private void handleIceCandidate(WebSocketSession session, JsonNode json) throws IOException {
        String targetSessionId = json.get("targetSessionId").asText();
        ParticipantInfo senderInfo = sessionInfo.get(session.getId());
        
        if (senderInfo == null) return;

        Set<WebSocketSession> room = lectureRooms.get(senderInfo.lectureId);
        if (room == null) return;

        for (WebSocketSession targetSession : room) {
            if (targetSession.getId().equals(targetSessionId) && targetSession.isOpen()) {
                ObjectNode iceMessage = objectMapper.createObjectNode();
                iceMessage.put("type", "ice-candidate");
                iceMessage.put("fromSessionId", session.getId());
                iceMessage.set("candidate", json.get("candidate"));
                targetSession.sendMessage(new TextMessage(iceMessage.toString()));
                break;
            }
        }
    }

    private void handleScreenShareStart(WebSocketSession session, JsonNode json) throws IOException {
        ParticipantInfo senderInfo = sessionInfo.get(session.getId());
        if (senderInfo == null || !"INSTRUCTOR".equals(senderInfo.role)) return;

        ObjectNode notification = objectMapper.createObjectNode();
        notification.put("type", "screen-share-started");
        notification.put("fromSessionId", session.getId());
        notification.put("instructorEmail", senderInfo.email);
        
        broadcastToRoom(senderInfo.lectureId, notification.toString(), session);
    }

    private void handleScreenShareStop(WebSocketSession session, JsonNode json) throws IOException {
        ParticipantInfo senderInfo = sessionInfo.get(session.getId());
        if (senderInfo == null || !"INSTRUCTOR".equals(senderInfo.role)) return;

        ObjectNode notification = objectMapper.createObjectNode();
        notification.put("type", "screen-share-stopped");
        notification.put("fromSessionId", session.getId());
        
        broadcastToRoom(senderInfo.lectureId, notification.toString(), session);
    }

    private void handleChat(WebSocketSession session, JsonNode json) throws IOException {
        ParticipantInfo senderInfo = sessionInfo.get(session.getId());
        if (senderInfo == null) return;

        ObjectNode chatMessage = objectMapper.createObjectNode();
        chatMessage.put("type", "chat");
        chatMessage.put("fromSessionId", session.getId());
        chatMessage.put("fromEmail", senderInfo.email);
        chatMessage.put("fromName", senderInfo.name);
        chatMessage.put("fromRole", senderInfo.role);
        chatMessage.put("message", json.get("message").asText());
        chatMessage.put("timestamp", System.currentTimeMillis());
        
        broadcastToRoom(senderInfo.lectureId, chatMessage.toString(), null); // Include sender
    }

    private void handleLeave(WebSocketSession session) throws IOException {
        removeSession(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        log.info("WebSocket connection closed: {} with status: {}", session.getId(), status);
        removeSession(session);
    }

    private void removeSession(WebSocketSession session) throws IOException {
        ParticipantInfo info = sessionInfo.remove(session.getId());
        if (info == null) return;

        Set<WebSocketSession> room = lectureRooms.get(info.lectureId);
        if (room != null) {
            room.remove(session);
            if (room.isEmpty()) {
                lectureRooms.remove(info.lectureId);
            }
        }

        // Remove instructor tracking
        if ("INSTRUCTOR".equals(info.role)) {
            instructorSessions.remove(info.lectureId);
        }

        // Notify others
        ObjectNode leaveNotification = objectMapper.createObjectNode();
        leaveNotification.put("type", "user-left");
        leaveNotification.put("sessionId", session.getId());
        leaveNotification.put("email", info.email);
        leaveNotification.put("name", info.name);
        leaveNotification.put("role", info.role);
        
        broadcastToRoom(info.lectureId, leaveNotification.toString(), null);

        log.info("User {} left lecture {}", info.email, info.lectureId);
    }

    private void sendParticipantsList(WebSocketSession session, String lectureId) throws IOException {
        Set<WebSocketSession> room = lectureRooms.get(lectureId);
        if (room == null) return;

        ObjectNode participantsMessage = objectMapper.createObjectNode();
        participantsMessage.put("type", "participants");
        
        var participantsArray = participantsMessage.putArray("participants");
        for (WebSocketSession s : room) {
            if (!s.getId().equals(session.getId())) {
                ParticipantInfo pInfo = sessionInfo.get(s.getId());
                if (pInfo != null) {
                    var participant = participantsArray.addObject();
                    participant.put("sessionId", s.getId());
                    participant.put("email", pInfo.email);
                    participant.put("role", pInfo.role);
                    participant.put("name", pInfo.name);
                }
            }
        }

        session.sendMessage(new TextMessage(participantsMessage.toString()));
    }

    private void broadcastToRoom(String lectureId, String message, WebSocketSession exclude) throws IOException {
        Set<WebSocketSession> room = lectureRooms.get(lectureId);
        if (room == null) return;

        TextMessage textMessage = new TextMessage(message);
        for (WebSocketSession session : room) {
            if (session.isOpen() && (exclude == null || !session.getId().equals(exclude.getId()))) {
                try {
                    session.sendMessage(textMessage);
                } catch (IOException e) {
                    log.error("Error sending message to session {}: {}", session.getId(), e.getMessage());
                }
            }
        }
    }

    // Get participant count for a lecture
    public int getParticipantCount(String lectureId) {
        Set<WebSocketSession> room = lectureRooms.get(lectureId);
        return room != null ? room.size() : 0;
    }

    // Inner class to hold participant info
    private static class ParticipantInfo {
        final String lectureId;
        final String email;
        final String role;
        final String name;

        ParticipantInfo(String lectureId, String email, String role, String name) {
            this.lectureId = lectureId;
            this.email = email;
            this.role = role;
            this.name = name;
        }
    }
}
