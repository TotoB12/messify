import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Button,
  FlatList,
  Text,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
} from 'react-native-webrtc';

const signalingServer = 'https://9656f628-5d94-4836-a821-bd3aebc53c29-00-p66jrhn8i2y3.kirk.replit.dev/';

export default function App() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const ws = useRef(null);
  const peerConnection = useRef(new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  }));
  const dataChannel = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(signalingServer);

    ws.current.onopen = () => {
      console.log('WebSocket Connected');
      setupDataChannel();
    };

    ws.current.onmessage = (e) => {
      const message = JSON.parse(e.data);
      handleSignalingData(message);
    };

    return () => {
      ws.current.close();
    };
  }, []);

  const setupDataChannel = () => {
    try {
      dataChannel.current = peerConnection.current.createDataChannel('chat');
      dataChannel.current.onmessage = handleReceiveMessage;

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          sendMessageThroughSignalingChannel({
            type: 'candidate',
            candidate: event.candidate,
          });
        }
      };

      peerConnection.current.ondatachannel = (event) => {
        peerConnection.current.dataChannel = event.channel;
        peerConnection.current.dataChannel.onmessage = handleReceiveMessage;
      };

      createOffer();
    } catch (error) {
      console.error('Error setting up data channel:', error);
    }
  };

  const createOffer = async () => {
    try {
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      sendMessageThroughSignalingChannel({
        type: 'offer',
        offer: offer,
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const handleReceiveMessage = (event) => {
    const data = JSON.parse(event.data);
    setMessages((prevMessages) => [...prevMessages, { key: Math.random().toString(), text: data.message }]);
  };

  const handleSignalingData = async (data) => {
    switch (data.type) {
      case 'offer':
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        sendMessageThroughSignalingChannel({
          type: 'answer',
          answer: answer,
        });
        break;
      case 'answer':
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        break;
      case 'candidate':
        peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        break;
      default:
        break;
    }
  };

  const sendMessageThroughSignalingChannel = (message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  const sendMessage = () => {
    if (message.trim().length > 0) {
      const messageToSend = { message };
      dataChannel.current.send(JSON.stringify(messageToSend));
      setMessage('');
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.messagesList}
        data={messages}
        renderItem={({ item }) => (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        )}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#ccc"
          value={message}
          onChangeText={setMessage}
        />
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.buttonContainer}>
            <Button title="Send" onPress={sendMessage} color="#1e90ff" />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131315',
    paddingBottom: 10,
  },
  messagesList: {
    paddingHorizontal: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#252525',
    color: '#fff',
    borderColor: '#333',
    borderWidth: 1,
    marginRight: 10,
    paddingHorizontal: 10,
    borderRadius: 20,
    height: 40,
  },
  buttonContainer: {
    overflow: 'hidden',
    borderRadius: 20,
  },
  messageBox: {
    marginVertical: 5,
    padding: 10,
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
  },
});
