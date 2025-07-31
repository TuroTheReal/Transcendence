import { classes } from "../styles/retroStyles.js";
import { createNeonContainer } from "../styles/neonTheme.js";
import { i18n } from "../services/i18n.js";

export function createLiveChat() {
  const element = document.createElement("div");
  element.className = "fixed bottom-4 right-4 z-50";
  
  const openChatButton = document.createElement("button");
  openChatButton.className = `${classes.actionButton} px-4 py-2 rounded-full shadow-lg`;
  openChatButton.innerHTML = `
    <span class="${classes.neonText}">
      💬 Chat Live
    </span>
  `;
  
  const maxChats = 1;
  const chats = [];
  
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
    closeButton.addEventListener("click", () => {
      element.removeChild(chatWindow);
      chats.splice(chats.indexOf(chatWindow), 1);
    });
  });
  
  return element;
}

function createChatWindow(): HTMLElement {
  const chatWindow = document.createElement("div");
  chatWindow.className = `${classes.retroPanel} rounded-xl w-80 h-96 flex flex-col shadow-2xl animate-slide-up`;
  
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
    <div class="${classes.retroPanel} border-b-2 border-purple-400/30 p-4 flex justify-between items-center rounded-t-xl">
      <h3 class="${classes.neonText} font-bold text-lg">
        💬 Chat Live
      </h3>
      <button id="close-chat" class="${classes.retroButton} text-red-400 text-sm px-2 py-1 rounded hover:${classes.neonBorder}">
        ✕
      </button>
    </div>
    
    <!-- Chat Messages -->
    <div class="flex-1 p-4 overflow-y-auto" id="live-chat-messages">
      <div class="text-center ${classes.neonText} py-4">
        💭 Conversation en temps réel
      </div>
    </div>
    
    <!-- Chat Input -->
    <div class="${classes.retroPanel} border-t-2 border-purple-400/30 p-4 flex gap-2 rounded-b-xl">
      <input 
        type="text" 
        placeholder="Tapez votre message..." 
        id="live-message-input" 
        class="${classes.tournamentInput} flex-1 text-sm"
      >
      <button id="send-live-message" class="${classes.actionButton} px-3 py-1 text-sm">
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
      ? `${classes.retroPanel} border-purple-400 text-purple-300` 
      : `${classes.retroPanel} border-cyan-400 text-cyan-300`
    }">
      <p class="text-sm font-medium">${message}</p>
      <p class="text-xs opacity-75 mt-1">${new Date().toLocaleTimeString()}</p>
    </div>
  `;
  
  container.appendChild(messageDiv);
  container.scrollTop = container.scrollHeight;
}
