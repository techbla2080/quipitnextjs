// components/Forest.tsx
import { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

interface ForestProps {
  userId: string;
}

interface ForestMessage {
  userId: string;
  message: string;
  timestamp: string;
}

interface Forest {
  _id: string;
  name: string;
  userIds: string[];
  messages: ForestMessage[];
}

export default function Forest({ userId }: ForestProps) {
  const [forests, setForests] = useState<Forest[]>([]);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState<string[]>([]); // Fixed: Single declaration with correct type

  useEffect(() => {
    // Fetch forests for the user
    fetch(`/api/forests?userId=${userId}`)
      .then(res => res.json())
      .then(data => setForests(data))
      .catch(err => console.error('Failed to fetch forests:', err));

    // Socket.io setup
    socket.on('connect', () => {
      socket.emit('join', '1');
    });
    socket.on('message', (msg: string) => {
      setChat(c => [...c, msg]);
    });

    // Cleanup socket listener
    return () => {
      socket.off('message');
    };
  }, [userId]);

  const sendMessage = async () => {
    if (message) {
      socket.emit('message', message);
      await fetch('/api/forests/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, forestId: forests[0]?._id, message }),
      }).catch(err => console.error('Failed to send message:', err));
      setMessage('');
    }
  };

  return (
    <div className="mt-4">
      <h2 className="text-xl text-green-700 dark:text-white">My Forest</h2>
      {forests.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No forests yet.</p>
      ) : (
        forests.map(f => (
          <div key={f._id}>
            <p>{f.name}: {f.userIds.join(', ')}</p>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="border p-2 m-2"
            />
            <button onClick={sendMessage} className="bg-green-500 text-white p-2">Send</button>
            <ul>
              {chat.map((msg, i) => <li key={i}>{msg}</li>)}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}   