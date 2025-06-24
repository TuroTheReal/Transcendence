export function createLiveChat() {
  const element = document.createElement("div");
  const openChat = document.createElement("button");
  const maxChats = 1;
  const chats = [];
  openChat.textContent = "Open Chat";
  element.appendChild(openChat);
  openChat.addEventListener("click", () => {
    if (chats.length >= maxChats) {
      return;
    }
    const chat = document.createElement("div");
    chat.textContent = "Chat";
    element.appendChild(chat);
    chats.push(chat);
    const closeChat = document.createElement("button");
    closeChat.textContent = "Close Chat";
    chat.appendChild(closeChat);
    closeChat.addEventListener("click", () => {
      element.removeChild(chat);
    });
  });
  return element;
}
