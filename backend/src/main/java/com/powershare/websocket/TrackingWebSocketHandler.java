package com.powershare.websocket;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class TrackingWebSocketHandler extends TextWebSocketHandler {

    // Maps orderId -> List of active WebSocket sessions
    private static final ConcurrentHashMap<String, CopyOnWriteArrayList<WebSocketSession>> orderSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String query = session.getUri().getQuery();
        String orderId = getParam(query, "orderId");
        if (orderId != null) {
            session.getAttributes().put("orderId", orderId);
            orderSessions.computeIfAbsent(orderId, k -> new CopyOnWriteArrayList<>()).add(session);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String orderId = (String) session.getAttributes().get("orderId");
        if (orderId != null && orderSessions.containsKey(orderId)) {
            orderSessions.get(orderId).remove(session);
            if (orderSessions.get(orderId).isEmpty()) {
                orderSessions.remove(orderId);
            }
        }
    }

    public void broadcast(String orderId, String jsonPayload) {
        List<WebSocketSession> sessions = orderSessions.get(orderId);
        if (sessions != null) {
            TextMessage message = new TextMessage(jsonPayload);
            for (WebSocketSession session : sessions) {
                try {
                    if (session.isOpen()) {
                        session.sendMessage(message);
                    }
                } catch (Exception e) {
                    // Ignore session broadcast errors
                }
            }
        }
    }

    private String getParam(String query, String paramName) {
        if (query == null) return null;
        String[] params = query.split("&");
        for (String param : params) {
            String[] pair = param.split("=");
            if (pair.length > 1 && pair[0].equalsIgnoreCase(paramName)) {
                return pair[1];
            }
        }
        return null;
    }
}
