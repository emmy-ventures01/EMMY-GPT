const chatContainer = document.getElementById("chatContainer");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const plusBtn = document.getElementById("plusBtn");
const fileInput = document.getElementById("fileInput");

const predefinedResponses = {
  "who made you": "I was created and developed by Emmyventures.",
  "who developed you": "I was created and developed by Emmyventures.",
  "who created you": "I was created and developed by Emmyventures.",
  "who wrote your life": "I was created and developed by Emmyventures."
};

let chatHistory = [];

function saveChatHistory() { localStorage.setItem("chat_history", JSON.stringify(chatHistory)); }
function loadChatHistory() {
  const data = localStorage.getItem("chat_history");
  if(data) chatHistory = JSON.parse(data);
}

function addMessage(text, sender="ai") {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", sender);
  chatContainer.appendChild(msgDiv);

  if(sender==="ai"){
    sendBtn.disabled=true; userInput.disabled=true;
    let i=0;
    const interval = setInterval(()=>{
      msgDiv.textContent += text.charAt(i);
      i++; chatContainer.scrollTop=chatContainer.scrollHeight;
      if(i>=text.length){ clearInterval(interval); sendBtn.disabled=false; userInput.disabled=false; userInput.focus(); }
    },20);
  } else {
    msgDiv.textContent = text;
    chatContainer.scrollTop=chatContainer.scrollHeight;
  }
  chatHistory.push({sender,text}); saveChatHistory();
}

async function sendMessageToAPI(message){
  try{
    const res = await fetch("https://emmy-gpt.onrender.com/api/chat",{
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({message})
    });
    const data = await res.json();
    return data.reply;
  }catch(e){
    return "Emmy-GPT server is currently unavailable.";
  }
}

async function handleSend(){
  const message = userInput.value.trim(); if(!message) return;
  addMessage(message,"user"); userInput.value="";

  const lowerMsg = message.toLowerCase();
  let aiResponse;
  if(predefinedResponses[lowerMsg]){
    aiResponse = predefinedResponses[lowerMsg];
  } else {
    aiResponse = await sendMessageToAPI(message);
  }
  addMessage(aiResponse,"ai");
}

// File upload handling
plusBtn.addEventListener("click", ()=> fileInput.click());
fileInput.addEventListener("change", async (e)=>{
  if(e.target.files.length===0) return;
  const file = e.target.files[0];
  const formData = new FormData();
  formData.append("file", file);

  sendBtn.disabled=true; userInput.disabled=true;
  const res = await fetch("https://emmy-gpt.onrender.com/api/file",{
    method:"POST", body:formData
  });
  const data = await res.json();

  // If response is an image URL, show clickable link
  if(data.reply.startsWith("http")){
    addMessage(`Image processed: ${data.reply}`, "ai");
  } else {
    addMessage(data.reply,"ai");
  }
});

// Load previous chat
loadChatHistory();
chatHistory.forEach(m=>addMessage(m.text,m.sender));

sendBtn.addEventListener("click", handleSend);
userInput.addEventListener("keypress", e=>{if(e.key==="Enter" && !sendBtn.disabled) handleSend();});

// Automated welcome message
window.addEventListener("load", ()=>{
  setTimeout(()=>{
    addMessage(`Hello 👋 there, this is Emmy-GPT your virtual AI assistant to help you solve problems and answer questions intelligently.`,"ai");
  },3000);
});
