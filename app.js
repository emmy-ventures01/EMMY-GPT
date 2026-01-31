// ======================
// Configuration
// ======================
const OPENAI_KEYS = [
  "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",
  "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",
  "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",
  "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",
  "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"
];
let currentKeyIndex = 0;
function getNextAPIKey() {
  const key = OPENAI_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % OPENAI_KEYS.length;
  return key;
}

// ======================
// DOM Elements
// ======================
const chatContainer = document.getElementById("chatContainer");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const plusBtn = document.getElementById("plusBtn");
const extraOptions = document.getElementById("extraOptions");
const voiceBtn = document.getElementById("voiceBtn");
const imageBtn = document.getElementById("imageBtn");
const imagePromptInput = document.getElementById("imagePrompt");
const chatHistoryBtn = document.getElementById("chatHistoryBtn");

// ======================
// User info
// ======================
const username = localStorage.getItem('emmy_username') || "there";

// ======================
// Chat history
// ======================
let chatHistory = JSON.parse(localStorage.getItem(`chat_${username}`) || "[]");
function saveChatHistory() { localStorage.setItem(`chat_${username}`, JSON.stringify(chatHistory)); }
function loadChatHistory() {
  chatContainer.innerHTML = "";
  chatHistory.forEach(msg => addMessage(msg.text, msg.sender, msg.isImage));
}

// ======================
// Add message
// ======================
function addMessage(text, sender="ai", isImage=false){
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", sender);

  if(sender==="ai"){
    sendBtn.disabled = true;
    userInput.disabled = true;
    plusBtn.disabled = true;

    if(isImage){
      const img = document.createElement("img");
      img.src = text;
      img.style.maxWidth = "100%";
      img.style.borderRadius = "8px";
      msgDiv.appendChild(img);
      chatContainer.appendChild(msgDiv);
      chatContainer.scrollTop = chatContainer.scrollHeight;
      sendBtn.disabled=false; userInput.disabled=false; plusBtn.disabled=false;
    } else {
      typeAIMessage(text, msgDiv).then(()=>{
        sendBtn.disabled=false; userInput.disabled=false; plusBtn.disabled=false; userInput.focus();
      });
    }
  } else {
    msgDiv.textContent = text;
  }

  chatContainer.appendChild(msgDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Typing effect
function typeAIMessage(text, aiDiv){
  return new Promise(resolve=>{
    aiDiv.textContent="";
    let i=0;
    const speed=20;
    const interval=setInterval(()=>{
      aiDiv.textContent+=text.charAt(i);
      i++;
      chatContainer.scrollTop = chatContainer.scrollHeight;
      if(i>=text.length){ clearInterval(interval); resolve(); }
    }, speed);
  });
}

// ======================
// Send text
// ======================
async function sendText(message){
  addMessage(message,"user");
  chatHistory.push({sender:"user", text:message});
  saveChatHistory();

  try{
    const apiKey=getNextAPIKey();
    const res=await fetch("https://api.openai.com/v1/chat/completions",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},
      body:JSON.stringify({model:"gpt-3.5-turbo", messages:[{role:"user", content:message}], max_tokens:500})
    });
    const data=await res.json();
    const reply=(data.choices && data.choices[0].message.content) || "Emmy-GPT server is currently unavailable.";
    addMessage(reply,"ai");
    chatHistory.push({sender:"ai", text:reply});
    saveChatHistory();
  }catch{
    addMessage("Emmy-GPT server is currently unavailable.","ai");
  }
}

// ======================
// Send Image
// ======================
async function sendImage(prompt){
  addMessage(`Generating image for: ${prompt}`,"user");
  chatHistory.push({sender:"user", text:`Image prompt: ${prompt}`});
  saveChatHistory();
  try{
    const apiKey=getNextAPIKey();
    const res=await fetch("https://api.openai.com/v1/images/generations",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},
      body:JSON.stringify({prompt,n:1,size:"512x512"})
    });
    const data=await res.json();
    if(data.data && data.data[0].url){
      addMessage(data.data[0].url,"ai",true);
      chatHistory.push({sender:"ai", text:"[Image]", isImage:true});
      saveChatHistory();
    } else { addMessage("Emmy-GPT server is currently unavailable.","ai"); }
  }catch{ addMessage("Emmy-GPT server is currently unavailable.","ai"); }
}

// ======================
// Send Voice Note
// ======================
async function sendVoice(file){
  addMessage("Voice note sent...","user");
  chatHistory.push({sender:"user", text:"[Voice note]"});
  saveChatHistory();
  const formData=new FormData();
  formData.append("audio", file);
  try{
    const res=await fetch("http://localhost:3000/api/voice",{method:"POST", body:formData});
    const data=await res.json();
    const transcript=data.transcript || "Emmy-GPT server is currently unavailable.";
    addMessage(`Voice: ${transcript}`,"ai");
    chatHistory.push({sender:"ai", text:`Voice: ${transcript}`});
    saveChatHistory();
  }catch{ addMessage("Emmy-GPT server is currently unavailable.","ai"); }
}

// ======================
// Event Listeners
// ======================
sendBtn.addEventListener("click", ()=>{
  const msg=userInput.value.trim();
  if(msg){ sendText(msg); userInput.value=""; }
});
userInput.addEventListener("keypress", e=>{
  if(e.key==="Enter" && !sendBtn.disabled){
    const msg=userInput.value.trim();
    if(msg) sendText(msg);
    userInput.value="";
  }
});
plusBtn.addEventListener("click", ()=>{ extraOptions.classList.toggle("show"); });
voiceBtn.addEventListener("click", async()=>{
  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    const mediaRecorder=new MediaRecorder(stream);
    const chunks=[];
    mediaRecorder.ondataavailable=e=>chunks.push(e.data);
    mediaRecorder.onstop=()=>{ const blob=new Blob(chunks,{type:"audio/webm"}); sendVoice(blob); };
    mediaRecorder.start();
    setTimeout(()=>mediaRecorder.stop(),5000);
  }catch{ alert("Microphone access denied."); }
});
imageBtn.addEventListener("click", ()=>{
  const prompt=imagePromptInput.value.trim();
  if(prompt){ sendImage(prompt); imagePromptInput.value=""; }
});
chatHistoryBtn.addEventListener("click", loadChatHistory);

// ======================
// Welcome message
// ======================
window.addEventListener("load", ()=>{
  const welcomeText=`Hello 👋 ${username}, this is Emmy-GPT your virtual AI assistant to help you solve problems and answer questions intelligently.`;
  addMessage(welcomeText,"ai");
  chatHistory.push({sender:"ai", text:welcomeText});
  saveChatHistory();
});
