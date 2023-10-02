import { Container, Flex, Box, Button, Text, Input } from '@chakra-ui/react';
import React, { useState, useEffect, useRef } from "react";
import { Canvas, useFrame,useLoader} from "@react-three/fiber";
import MessagesBackground from "src/components/MessagesBackground"
const socket_url = "ws://192.168.1.5:1234/ws";

export default function Index() {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const [username, setUsername] = useState("default");
  const [userColors, setUserColors] = useState({});
  const [userHasSentMessage, setUserHasSentMessage] = useState(false);
  const messagesEndRef = useRef(null);

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const getUsernameColor = (username) => {
    if (!userColors[username]) {
      setUserColors((prevColors) => ({
        ...prevColors,
        [username]: getRandomColor(),
      }));
    }
    return userColors[username] || '#000000';
  };

  useEffect(() => {
    const sock = new WebSocket(socket_url);
    let intervalId;

    sock.onopen = () => {
      setSocket(sock);
      intervalId = setInterval(() => sock.send(JSON.stringify({ option: 0 })), 1000);
    };

    sock.onmessage = (msg) => {
      const parsedData = JSON.parse(msg.data);
      if (parsedData?.messages) setMessages(parsedData.messages);
    };

    return () => {
      clearInterval(intervalId);
      if (sock.readyState === WebSocket.OPEN) sock.close();
    };
  }, []);

useEffect(() => {
  if (messagesEndRef.current) {
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }
}, [messages.length]);

  return (
    <>
<MessagesBackground messages={messages} style={{ position: 'fixed', top: 0, left: 0, zIndex: -1, width: '100vw', height: '100vh' }} />
    <Container centerContent>
      <Text mb="4" mt="4" fontSize="35px" fontWeight="800">REAL TIME SHITTTTT CHAT</Text>
      <Box mb="4">
        <Input className="main-input" placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
      </Box>
      <Box className="main-box" overflowY="auto" maxHeight="400px" centerContent mb="4">
        {messages.map((message, index) => (
          <Box key={index} mb="5px">
            <Text fontSize="17px" mb="-8px" style={{ color: getUsernameColor(message.username) }}>{message.username}</Text>
            <Text fontSize="20px">{message.message}</Text>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>
    <Box mt="4" textAlign="left">
      <Flex>
        <Input className="main-input" value={msg} placeholder="Type a message" onChange={(e) => setMsg(e.target.value)} flex="1" />
        <Button className="main-btn" onClick={() => {
            socket.send(JSON.stringify({ option: 1, payload: { username, message: msg } }));
            setMsg("");
        }} ml="2">Send</Button>
      </Flex>
    </Box>

    </Container>
    </>
  );
}
