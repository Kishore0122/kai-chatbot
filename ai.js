const API_KEY = "AIzaSyBfoY1NSgMkTCMent-KIqsywQJvZMOgk9Y";
const MODEL = "gemini-1.5-flash";
const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const chatBox = document.getElementById("chat-box");
const form = document.getElementById("chat-form");
const textInput = document.getElementById("text-input");
const fileInput = document.getElementById("file-input");

let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];

window.addEventListener("DOMContentLoaded", () => {
  chatHistory.forEach(({ sender, text }) => addMessage(sender, text));
});

form.addEventListener("submit", handleSubmit);

async function handleSubmit(e) {
  e.preventDefault();

  const userMessage = textInput.value.trim();
  const file = fileInput.files[0];

  if (!userMessage && !file) return;

  // Show user message with animation
  if (userMessage) addMessage("user", userMessage, "typing");

  // Show uploaded file name
  if (file) addMessage("user", `📎 Uploaded: ${file.name}`, "file");

  textInput.value = "";
  fileInput.value = "";

  const parts = [];
  if (userMessage) parts.push({ text: userMessage });

  if (file) {
    const base64 = await fileToBase64(file);
    parts.push({
      inlineData: {
        mimeType: file.type,
        data: base64.split(",")[1]
      }
    });
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts }]
      })
    });

    const data = await response.json();
    console.log("Gemini API response:", data);

    if (response.ok && data.candidates?.length) {
      const botReply = data.candidates[0].content.parts[0].text;
      addMessage("kai", botReply, "response");
    } else {
      addMessage("kai", "⚠️ Something went wrong. Please try again later.", "error");
    }
  } catch (err) {
    console.error("Error:", err);
    addMessage("kai", "❌ An error occurred. See the console for details.", "error");
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function addMessage(sender, text, type = "normal") {
  const msg = document.createElement("div");
  msg.className = `message ${sender} ${type}`;

  const formattedText = text
    .split("\n\n")
    .map(para => `<p>${para.replace(/\n/g, "<br>")}</p>`)
    .join("");

  msg.innerHTML = formattedText;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;

  // Save to localStorage
  chatHistory.push({ sender, text });
  localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
}

function clearChat() {
  localStorage.removeItem("chatHistory");
  chatBox.innerHTML = "";
  chatHistory = [];
}
