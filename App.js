import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TextInput, Button, FlatList, Text, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { RTCPeerConnection, RTCIceCandidate, RTCSessionDescription, mediaDevices } from 'react-native-webrtc';

const configuration = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]}; // STUN server configuration

export default function App() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const pc = useRef(new RTCPeerConnection(configuration)).current;

  useEffect(() => {
    // Setup peer connection and event listeners here
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // Send candidate to peer via signaling server
      }
    };

    pc.ondatachannel = (event) => {
      const channel = event.channel;
      channel.onmessage = (e) => {
        // Handle incoming messages
        const incomingMessage = JSON.parse(e.data);
        setMessages((prevMessages) => [...prevMessages, incomingMessage]);
      };
    };

    // Setup data channel for sending messages
    const dataChannel = pc.createDataChannel("chat");
    dataChannel.onopen = (event) => {
      console.log("Data channel is open");
    };

    // Example function to send message through data channel
    const sendMessageThroughDataChannel = (msg) => {
      const messageObj = { text: msg, key: Math.random().toString() };
      dataChannel.send(JSON.stringify(messageObj));
      setMessages((prevMessages) => [...prevMessages, messageObj]);
    };

    // Replace sendMessage function with sendMessageThroughDataChannel
    // Remember to adjust the rest of your app logic to initiate and handle WebRTC connections

  }, []);

  const sendMessage = () => {
    if (message.trim().length > 0) {
      // Update to send message over WebRTC data channel
      setMessage('');
    }
  };

  React.useEffect(() => {
    Animated.timing(
      fadeAnim,
      {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true
      }
    ).start();
  }, [fadeAnim])

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
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
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
