import { Canvas, useFrame } from '@react-three/fiber';
import { createNoise2D } from 'simplex-noise';
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Text } from '@react-three/drei';

const SphereField = ({ messages }) => {
  const noise = new createNoise2D();

  const groupRef = useRef();
  const [spheres, setSpheres] = useState(() => 
    messages.map(message => createSphere(message))
  );

  useEffect(() => {
    setSpheres(spheres => [...spheres, ...messages.slice(spheres.length).map(message => createSphere(message))])
  }, [messages]);
  
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((group, index) => {
        const { seed } = spheres[index];
        const time = clock.getElapsedTime() + seed;
        const mesh_color = group.children[0];

            const hue = (time * 50) % 360; 
            mesh_color.material.color.set(`hsl(${hue}, 100%, 50%)`);
        
        group.position.y += Math.sin(time) * noise(time, seed) * 0.05;
        group.position.z += Math.sin(time) * noise(time, seed) * 0.005;
        group.position.x += Math.sin(time) * noise(time, seed) * 0.05;
        const scale = 0.5 + Math.abs(Math.sin(time)) * 0.5;
        group.scale.set(scale, scale, scale);
      });
    }
  });

  return (
    <group ref={groupRef}>
      {spheres.map(({ color, seed, position, args, index }, sphereIndex) => (
        <group key={sphereIndex} position={position}>
          <mesh>
            <sphereGeometry args={args} />
            <meshStandardMaterial color={color} />
          </mesh>
          <Text 
            position={[0, 0.3, 0]}  // Adjust the position as needed
            color="white" // Adjust color as needed
            fontSize={0.3}  // Adjust font size as needed
          >
            {messages[sphereIndex].username}
          </Text>
        </group>
      ))}
    </group>
  );
};

function createSphere(message) {
  const seed = [...message.message].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const color = `hsl(${seed % 360}, 100%, 50%)`;
  const position = [Math.random() * 10 - 10 / 2, Math.random() * 10 - 10 / 2, Math.random() * 10 - 10 / 2];
  const args = [Math.random() * message.message.length * 0.05, 302, 302];
  return { color, seed, position, args };
}

const Background = ({ messages }) => {
  const redLightIntensity = useMemo(() => Math.random() * 10, []);
  const blueLightIntensity = useMemo(() => Math.random() * 10, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, zIndex: -1, width: '100vw', height: '100vh' }}>
      <Canvas shadows>
        <ambientLight color={'red'} intensity={redLightIntensity} />
        <ambientLight color={'blue'} intensity={blueLightIntensity} />
        <SphereField messages={messages} />
      </Canvas>
    </div>
  );
};


export default Background;
