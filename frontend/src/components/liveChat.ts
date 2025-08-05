import { i18n } from "../services/i18n.js";

export function createLiveChat() {
  const element = document.createElement("div");
  element.className = "fixed bottom-4 right-4 z-50";
  
  const openChatButton = document.createElement("button");
  openChatButton.className = `bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-purple-300 font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full px-4 py-2 rounded-full shadow-lg`;
  openChatButton.innerHTML = `
    <span class="text-purple-300 drop-shadow-[0_0_3px_rgb(187,134,252)] drop-shadow-[0_0_6px_rgb(187,134,252)] drop-shadow-[0_0_9px_rgb(187,134,252)] animate-pulse">
      💬 Chat Live
    </span>
  `;
  
  const maxChats = 1;
  const chats: HTMLElement[] = [];
  
  element.appendChild(openChatButton);
  
  openChatButton.addEventListener("click", () => {
    if (chats.length >= maxChats) {
      return;
    }
    
    const chatWindow = createChatWindow();
    element.appendChild(chatWindow);
    chats.push(chatWindow);
    
    // Position the chat window above the button
    chatWindow.style.bottom = "60px";
    chatWindow.style.right = "0";
    
    const closeButton = chatWindow.querySelector('#close-chat');
    closeButton?.addEventListener("click", () => {
      element.removeChild(chatWindow);
      chats.splice(chats.indexOf(chatWindow), 1);
    });
  });
  
  return element;
}

function createChatWindow(): HTMLElement {
  const chatWindow = document.createElement("div");
  chatWindow.className = `bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-xl w-80 h-96 flex flex-col shadow-2xl animate-slide-up`;
  
  chatWindow.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
      
      * {
        font-family: 'Orbitron', monospace;
      }
      
      @keyframes slide-up {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .animate-slide-up {
        animation: slide-up 0.3s ease-out;
      }
    </style>
    
    <!-- Chat Header -->
    <div class="bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm border-b-2 border-purple-400/30 p-4 flex justify-between items-center rounded-t-xl">
      <h3 class="text-purple-300 drop-shadow-[0_0_3px_rgb(187,134,252)] drop-shadow-[0_0_6px_rgb(187,134,252)] drop-shadow-[0_0_9px_rgb(187,134,252)] animate-pulse font-bold text-lg">
        💬 Chat Live
      </h3>
      <button id="close-chat" class="bg-gradient-to-br from-purple-900/20 via-black to-purple-900/20 border-2 border-purple-400 shadow-[0_0_10px_rgb(157,78,221,0.4),inset_0_0_10px_rgb(157,78,221,0.2)] transition-all duration-300 relative overflow-hidden hover:border-purple-300 hover:shadow-[0_0_20px_rgb(157,78,221),inset_0_0_20px_rgb(157,78,221,0.3)] hover:scale-105 before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full text-red-400 text-sm px-2 py-1 rounded hover:shadow-[0_0_10px_rgb(157,78,221),inset_0_0_10px_rgb(157,78,221),0_0_20px_rgb(157,78,221,0.4)]">
        ✕
      </button>
    </div>
    
    <!-- Chat Messages -->
    <div class="flex-1 p-4 overflow-y-auto" id="live-chat-messages">
      <div class="text-center text-purple-300 drop-shadow-[0_0_3px_rgb(187,134,252)] drop-shadow-[0_0_6px_rgb(187,134,252)] drop-shadow-[0_0_9px_rgb(187,134,252)] animate-pulse py-4">
        💭 Conversation en temps réel
      </div>
    </div>
    
    <!-- Chat Input -->
    <div class="bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm border-t-2 border-purple-400/30 p-4 flex gap-2 rounded-b-xl">
      <input 
        type="text" 
        placeholder="Tapez votre message..." 
        id="live-message-input" 
        class="bg-gradient-to-br from-black to-purple-900/20 border-2 border-purple-400 text-purple-300 shadow-[0_0_10px_rgb(157,78,221,0.4),inset_0_0_10px_rgb(157,78,221,0.2)] focus:border-purple-300 focus:shadow-[0_0_20px_rgb(157,78,221),inset_0_0_20px_rgb(157,78,221,0.3)] focus:outline-none px-4 py-2 rounded-lg w-full text-center font-bold flex-1 text-sm"
      >
      <button id="send-live-message" class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-purple-300 font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full px-3 py-1 text-sm">
        📤
      </button>
    </div>
  `;
  
  // Add event listeners for chat functionality
  const messageInput = chatWindow.querySelector('#live-message-input') as HTMLInputElement;
  const sendButton = chatWindow.querySelector('#send-live-message') as HTMLButtonElement;
  const messagesContainer = chatWindow.querySelector('#live-chat-messages') as HTMLElement;
  
  const sendMessage = () => {
    const message = messageInput.value.trim();
    if (message) {
      addMessageToChat(messagesContainer, message, 'me');
      messageInput.value = '';
      
      // Simulate a response (for demo purposes)
      setTimeout(() => {
        addMessageToChat(messagesContainer, `Echo: ${message}`, 'other');
      }, 1000);
    }
  };
  
  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
  
  return chatWindow;
}

function addMessageToChat(container: HTMLElement, message: string, sender: 'me' | 'other') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `mb-3 flex ${sender === 'me' ? 'justify-end' : 'justify-start'}`;
  
  messageDiv.innerHTML = `
    <div class="max-w-xs px-3 py-2 rounded-lg ${sender === 'me' 
      ? `bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm border-purple-400 text-purple-300` 
      : `bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm border-cyan-400 text-cyan-300`
    }">
      <p class="text-sm font-medium">${message}</p>
      <p class="text-xs opacity-75 mt-1">${new Date().toLocaleTimeString()}</p>
    </div>
  `;
  
  container.appendChild(messageDiv);
  container.scrollTop = container.scrollHeight;
}
