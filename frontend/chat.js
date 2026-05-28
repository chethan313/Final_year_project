const container = document.querySelector(".container");
const chatsContainer = document.querySelector(".chats-container");
const promptForm = document.querySelector(".prompt-form");
const promptInput = promptForm.querySelector(".prompt-input");
const themeToggleBtn = document.querySelector("#theme-toggle-btn");
const voiceToggleBtn = document.querySelector("#voice-toggle-btn");
const micBtn = document.querySelector("#mic-btn");
const historyList = document.querySelector(".chat-history-list");
const newChatBtn = document.querySelector("#new-chat-btn");

let typingInterval;
let recognition = null;
let isListening = false;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
let voiceOutputEnabled = localStorage.getItem("voiceOutputEnabled") !== "false";
let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];
let currentChatId = null;

const userData = {
  message: ""
};

// Set theme
const isLightTheme = localStorage.getItem("themeColor") === "light_mode";
document.body.classList.toggle("light-theme", isLightTheme);
themeToggleBtn.textContent = isLightTheme ? "dark_mode" : "light_mode";

// Save history to local storage
const saveHistory = () => {
  localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  renderHistory();
};

// Render chat history in the sidebar
// Render chat history in the sidebar
const renderHistory = () => {
  historyList.innerHTML = "";
  
  // Sort history: Pinned chats go to the top!
  const sortedHistory = [...chatHistory].sort((a, b) => {
    if (a.pinned === b.pinned) return b.id - a.id; // Sort by newest if pin status is the same
    return a.pinned ? -1 : 1; // Pinned items come first
  });

  sortedHistory.forEach((chat) => {
    const historyItem = document.createElement("div");
    historyItem.className = `history-item ${chat.id === currentChatId ? 'active' : ''}`;
    
    const pinIcon = chat.pinned ? `<span class="material-symbols-rounded pin-icon">keep</span>` : '';
    
    historyItem.innerHTML = `
      <div class="chat-info">
        <span class="material-symbols-rounded">chat_bubble</span> 
        <span class="chat-title">${chat.title}</span>
        ${pinIcon}
      </div>
      <div class="chat-menu">
        <button class="menu-btn material-symbols-rounded" title="Options">more_vert</button>
        <div class="dropdown-menu">
          <button class="pin-btn"><span class="material-symbols-rounded">${chat.pinned ? 'keep_off' : 'keep'}</span> ${chat.pinned ? 'Unpin' : 'Pin'}</button>
          <button class="rename-btn"><span class="material-symbols-rounded">edit</span> Rename</button>
          <button class="share-btn"><span class="material-symbols-rounded">share</span> Share</button>
          <button class="delete-btn"><span class="material-symbols-rounded">delete</span> Delete</button>
        </div>
      </div>
    `;
    
    // Load chat when clicking the title area
    historyItem.querySelector('.chat-info').addEventListener("click", () => loadChat(chat.id));
    
    // Menu Options Logic
    const menuBtn = historyItem.querySelector('.menu-btn');
    const dropdown = historyItem.querySelector('.dropdown-menu');
    
    // 1. Open/Close Menu
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Stop click from triggering 'loadChat'
      // Close all other open dropdowns first
      document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
        if(menu !== dropdown) menu.classList.remove('show');
      });
      dropdown.classList.toggle('show');
    });

    // 2. Pin Chat
    historyItem.querySelector('.pin-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      chat.pinned = !chat.pinned;
      saveHistory(); // Auto-triggers renderHistory to re-sort
    });

    // 3. Rename Chat
    historyItem.querySelector('.rename-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.remove('show');
      const newTitle = prompt("Enter a new name for this conversation:", chat.title);
      if (newTitle && newTitle.trim()) {
        chat.title = newTitle.trim();
        saveHistory();
      }
    });

    // 4. Share Chat
    historyItem.querySelector('.share-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.remove('show');
      // Formats the chat into a clean readable text block
      const chatText = chat.messages.map(m => `${m.role === 'user' ? 'You' : 'MES MSPS AI'}: ${m.text}`).join('\n\n');
      
      // Copies to user's clipboard
      navigator.clipboard.writeText(chatText).then(() => {
        alert("Conversation copied to clipboard! You can now paste it anywhere to share.");
      }).catch(() => {
        alert("Failed to copy chat. Your browser may not support clipboard access.");
      });
    });

    // 5. Delete Specific Chat
    historyItem.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      if(confirm("Are you sure you want to delete this chat?")) {
        chatHistory = chatHistory.filter(c => c.id !== chat.id);
        
        // If the user deletes the chat they are currently looking at, clear the screen
        if(currentChatId === chat.id) {
          startNewChat(); 
        } else {
          saveHistory();
        }
      }
    });
    
    historyList.appendChild(historyItem);
  });
};

// Add this at the very bottom of chat.js to close menus when clicking anywhere on the screen
document.addEventListener('click', () => {
  document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
    menu.classList.remove('show');
  });
});

// Load a specific chat from history
const loadChat = (id) => {
  currentChatId = id;
  const chat = chatHistory.find(c => c.id === id);
  chatsContainer.innerHTML = "";
  
  if (chat && chat.messages.length > 0) {
    document.body.classList.add("chats-active");
    chat.messages.forEach((msg) => {
      const isUser = msg.role === "user";
      const html = isUser 
        ? `<p class="message-text"></p>` 
        : `<img class="avatar" src="ai.png"/><p class="message-text"></p>`;
        
      const msgDiv = createMessageElement(html, isUser ? "user-message" : "bot-message");
      msgDiv.querySelector(".message-text").textContent = msg.text;
      chatsContainer.appendChild(msgDiv);
    });
    scrollToBottom();
  } else {
    document.body.classList.remove("chats-active");
  }
  renderHistory();
};

// Start a new chat session
const startNewChat = () => {
  currentChatId = null;
  chatsContainer.innerHTML = "";
  document.body.classList.remove("chats-active");
  renderHistory();
};

// Add a message to the current chat session
const addMessageToHistory = (role, text) => {
  if (!currentChatId) {
    currentChatId = Date.now().toString();
    // Generate a title from the first user message
    const title = text.length > 25 ? text.substring(0, 25) + '...' : text;
    chatHistory.unshift({ id: currentChatId, title, messages: [] });
  }
  
  const chatIndex = chatHistory.findIndex(c => c.id === currentChatId);
  chatHistory[chatIndex].messages.push({ role, text });
  saveHistory();
};

// Create message element
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// Scroll
const scrollToBottom = () => {
  container.scrollTo({
    top: container.scrollHeight,
    behavior: "smooth"
  });
};

// RAG API response
const generateResponse = async (botMsgDiv) => {
  const textElement = botMsgDiv.querySelector(".message-text");

  try {
    const response = await fetch("http://127.0.0.1:5000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: userData.message })
    });

    const data = await response.json();
    const responseText = data.answer;

    // Save bot response to history
    addMessageToHistory("bot", responseText);

    // Play typing effect and speak the response once complete
    typingEffect(responseText, textElement, botMsgDiv, () => speakText(responseText));
  } catch (error) {
    const errorMsg = "Server error. Please try again.";
    textElement.textContent = errorMsg;
    textElement.style.color = "red";
    botMsgDiv.classList.remove("loading");
    document.body.classList.remove("bot-responding");
  }
};

// Submit message
const handleFormSubmit = (e) => {
  e.preventDefault();
  const userMessage = promptInput.value.trim();

  if (!userMessage || document.body.classList.contains("bot-responding")) return;

  userData.message = userMessage;
  promptInput.value = "";
  document.body.classList.add("chats-active", "bot-responding");

  // User message DOM logic
  const userMsgHTML = `<p class="message-text"></p>`;
  const userMsgDiv = createMessageElement(userMsgHTML, "user-message");
  userMsgDiv.querySelector(".message-text").textContent = userData.message;
  chatsContainer.appendChild(userMsgDiv);
  scrollToBottom();

  // Save user message to history immediately
  addMessageToHistory("user", userData.message);

  setTimeout(() => {
    // Bot message DOM logic
    const botMsgHTML = `
      <img class="avatar" src="ai.png"/>
      <p class="message-text">Searching documents...</p>
    `;
    const botMsgDiv = createMessageElement(botMsgHTML, "bot-message", "loading");
    chatsContainer.appendChild(botMsgDiv);
    scrollToBottom();
    generateResponse(botMsgDiv);
  }, 600);
};

// Event Listeners
themeToggleBtn.addEventListener("click", () => {
  const isLightTheme = document.body.classList.toggle("light-theme");
  localStorage.setItem("themeColor", isLightTheme ? "light_mode" : "dark_mode");
  themeToggleBtn.textContent = isLightTheme ? "dark_mode" : "light_mode";
});

document.querySelector("#delete-chats-btn").addEventListener("click", () => {
  if(confirm("Are you sure you want to clear the current chat?")) {
    chatsContainer.innerHTML = "";
    document.body.classList.remove("chats-active", "bot-responding");
    // If you want this to delete the chat from memory too, add:
    // chatHistory = chatHistory.filter(c => c.id !== currentChatId);
    // startNewChat();
  }
});

newChatBtn.addEventListener("click", startNewChat);

document.querySelectorAll(".suggestions-item").forEach((suggestion) => {
  suggestion.addEventListener("click", () => {
    promptInput.value = suggestion.querySelector(".text").textContent;
    promptForm.dispatchEvent(new Event("submit"));
  });
});

promptForm.addEventListener("submit", handleFormSubmit);
micBtn.addEventListener("click", () => {
  if (!SpeechRecognition) {
    alert("Voice input is not supported in this browser.");
    return;
  }
  startVoice();
});
voiceToggleBtn.addEventListener("click", () => {
  voiceOutputEnabled = !voiceOutputEnabled;
  localStorage.setItem("voiceOutputEnabled", voiceOutputEnabled);
  updateVoiceToggleIcon();
  if (!voiceOutputEnabled && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
});
updateVoiceToggleIcon();

// Voice input and output helpers
function updateVoiceToggleIcon() {
  if (!voiceOutputEnabled) {
    voiceToggleBtn.textContent = "volume_off";
    voiceToggleBtn.style.color = "#d62939";
    voiceToggleBtn.title = "Voice output off";
  } else {
    voiceToggleBtn.textContent = "volume_up";
    voiceToggleBtn.style.color = "";
    voiceToggleBtn.title = "Voice output on";
  }
}

function updateMicButton() {
  micBtn.textContent = isListening ? "mic_off" : "mic";
  micBtn.style.color = isListening ? "#d62939" : "";
}

function startVoice() {
  if (!SpeechRecognition) {
    alert("Voice input is not supported in this browser.");
    return;
  }

  if (isListening && recognition) {
    recognition.stop();
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.continuous = false;

  recognition.onstart = () => {
    isListening = true;
    updateMicButton();
    promptInput.placeholder = "Listening... Speak now";
  };

  recognition.onresult = (event) => {
    let text = event.results[0][0].transcript;
    promptInput.value = text;
    promptInput.focus();
    setTimeout(() => {
      if (typeof promptForm.requestSubmit === "function") {
        promptForm.requestSubmit();
      } else {
        promptForm.dispatchEvent(new Event("submit", { cancelable: true }));
      }
    }, 200);
  };

  recognition.onspeechend = () => {
    if (recognition) recognition.stop();
  };

  recognition.onerror = (event) => {
    isListening = false;
    updateMicButton();
    promptInput.placeholder = "Ask anything";
    console.error("Speech recognition error:", event.error);
  };

  recognition.onend = () => {
    isListening = false;
    updateMicButton();
    promptInput.placeholder = "Ask anything";
  };

  recognition.start();
}

function speakText(text) {
  if (!voiceOutputEnabled || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function typingEffect(text, textElement, botMsgDiv, onComplete) {
  textElement.textContent = "";
  const words = text.split(" ");
  let wordIndex = 0;

  typingInterval = setInterval(() => {
    if (wordIndex < words.length) {
      textElement.textContent += (wordIndex === 0 ? "" : "") + words[wordIndex++] + (wordIndex < words.length ? " " : "");
      scrollToBottom();
    } else {
      clearInterval(typingInterval);
      botMsgDiv.classList.remove("loading");
      document.body.classList.remove("bot-responding");
      if (typeof onComplete === "function") onComplete();
    }
  }, 30);
}

// Initial Render
renderHistory();