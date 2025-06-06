console.log("Content script loaded");
console.log("Current pathname:", window.location.pathname);

/**
 * Main function to initialize the extension
 * Modifies the UI elements of the HKU ChatGPT interface
 */
function initExtension() {
  console.log("Initializing extension");
  const root = document.querySelector("#root").firstChild;

  // Header modifications
  // -------------------
  // Adjust header height and position
  const header = root.firstChild;
  header.style.minHeight = "fit-content";
  header.style.position = "sticky";
  header.firstChild.firstChild.className += " header_container";

  // Main content area modifications
  // ------------------------------
  root.lastChild.className = "main";
  const main = root.lastChild;
  // Set dimensions for main content area
  main.style.height = "100%";
  main.style.width = "100%";
  main.style.maxWidth = "50rem";
  main.firstChild.style.height = "100%";
  main.firstChild.style.maxHeight = "100%";
  main.firstChild.style.flexDirection = "column";
  main.firstChild.firstChild.style.flexGrow = "1";
  main.firstChild.firstChild.paddingBottom = "1.5rem";

  // Empty chat area adjustments
  const emptyChatArea = document.querySelector("#empty-chat");
  emptyChatArea.style.marginTop = "28%";
  emptyChatArea.style.paddingLeft = "1rem";

  // Hide token count area
  const tokenCountArea = main.firstChild.children[1];
  main.firstChild.children[1].style.display = "none";

  // Input area modifications
  // ----------------------
  const inputArea = main.firstChild.children[2];
  inputArea.className += " input-area";
  const inputContainer = inputArea.firstChild;
  inputContainer.style.display = "flex";
  inputContainer.style.padding = "0";
  const textArea = inputContainer.children[1];
  textArea.style.inset = "1px";
  textArea.className += " text-area";

  // Adjust text input box
  textBox = inputArea.querySelector("textarea");
  textBox.style.height = "fit-content";
  textBox.style.margin = "0.5rem";

  // Hide unnecessary elements
  for (const child of inputArea.children) {
    if (child === inputArea.firstChild) continue;
    child.style.width = "0";
  }

  // Button modifications
  // ------------------
  // Configure new session button
  const newSessionButton = inputArea.children[1].firstChild;
  newSessionButton.className += " new-session-button";
  newSessionButton.style.display = "block";
  newSessionButton.title = "Clear Session";

  const sendButton = inputArea.children[1].lastChild.firstChild;
  const changeModelButton = inputArea.children[1].lastChild.lastChild;
  
  // Create custom button areas
  // Create send area for send and model change buttons
  const sendArea = document.createElement("div");
  sendArea.className = "send-area";
  sendArea.appendChild(sendButton);
  sendArea.appendChild(changeModelButton);

  // Create function area for new session button
  const functionArea = document.createElement("div");
  functionArea.className = "function-area";
  functionArea.appendChild(newSessionButton);

  // Create bottom row to hold both areas
  const inputAreaBottomRow = document.createElement("div");
  inputAreaBottomRow.appendChild(functionArea);
  inputAreaBottomRow.appendChild(sendArea);
  inputAreaBottomRow.className = "input-area-bottom-row";
  textArea.appendChild(inputAreaBottomRow);

  // Set up mutation observer to watch for DOM changes
  const mutationObserver = new MutationObserver(observerCallback);
  mutationObserver.observe(main.firstChild, { attributes: true, childList: true, subtree: true });
}

/**
 * Callback function for the MutationObserver
 * Handles dynamic UI updates when the chat interface changes
 * @param {MutationRecord[]} mutationList - List of mutations detected
 */
const observerCallback = (mutationList) => {
  for (const mutation of mutationList) {
    // console.log("Mutation detected", mutation.type, mutation.target);
    if (mutation.type === "childList") {
      // Process token count elements
      // ---------------------------
      const elements = Array.from(mutation.target.querySelectorAll("span")).filter(item => item.innerText.includes("Token"));
      if (elements.length > 0) {
        elements[0].parentElement.style.display = "none";
        const tokensLeft = elements[0].parentElement.children[1].innerHTML;
        console.log("Tokens left", tokensLeft);
      }
      
      // Style user messages
      // ------------------
      const userMessages = Array.from(mutation.target.querySelectorAll("img[src='/User.png']"));
      for (const userMessage of userMessages) {
        // Hide user icon
        const userIcon = userMessage.parentElement.parentElement
        userIcon.style.display = "none";
        
        // Remove conversation round styling
        const convRound = userIcon.parentElement.parentElement;
        const style = document.createElement('style');
        const classNames = convRound.className.split(" ")
        style.innerHTML = `
          .${classNames[classNames.length - 1]}::before {
            display: none !important;
            content: none !important;
          }
        `;
        if (!document.head.contains(style)) {
          document.head.appendChild(style);
        }

        // Style user message container
        const userMessageContainer = userIcon.parentElement.children[1].firstChild;
        userMessageContainer.querySelector("div").style.display = "none";
        userMessageContainer.querySelector("hr").style.display = "none"; // remove horizontal line
        userMessageContainer.querySelector("div:nth-child(3)").style.setProperty("margin", "0.5rem 1rem", "important");
        userMessageContainer.querySelector("div:nth-child(3)").style.background = "none";
        userMessageContainer.querySelector("div:nth-child(3)").style.color = "white";
        userMessageContainer.querySelector("div:nth-child(4)").style.display = "none";
        
        // Apply bubble styling to user messages
        userMessageContainer.style.borderRadius = "0.5rem";
        userMessageContainer.style.width = "fit-content";
        userMessageContainer.style.maxWidth = "100%";
        userMessageContainer.style.background = "rgba(13, 17, 23, 0.8)";
      }

      // Style assistant messages
      // ----------------------
      const assistantMessages = Array.from(mutation.target.querySelectorAll("div[transmission='receiver']"));
      for (const assistantMessage of assistantMessages) {
        // Adjust container sizing
        assistantMessage.parentElement.style.flexBasis = "91%";
        assistantMessage.style.setProperty("background", "none", "important");
        assistantMessage.style.setProperty("box-shadow", "none", "important");
        assistantMessage.querySelector("hr").style.display = "none"; // remove horizontal line

        // Style response text area
        assistantMessage.children[2].style.setProperty("background", "none", "important");
        assistantMessage.children[2].style.setProperty("margin", "0.5rem 0 0 0", "important");
        assistantMessage.firstChild.style.display = "none";
        assistantMessage.children[3].style.display = "none";

        // Create metadata line with model info and timestamp
        if (assistantMessage.firstChild.children.length > 1 && assistantMessage.lastChild.className !== "meta-line"){
          const modelName = assistantMessage.firstChild.firstChild.innerHTML;
          const tokenUsed = assistantMessage.firstChild.lastChild.innerHTML;
          const createdTime = assistantMessage.children[3].innerHTML;
          const metaLine = document.createElement("div");
          metaLine.className = "meta-line";
          metaLine.innerHTML = `<div>${modelName} ${tokenUsed}</div><div>${createdTime}</div>`;
          assistantMessage.appendChild(metaLine);
        };
      }
    }
  }
};

/**
 * Waits for the send button to be available in the DOM
 * Uses polling to check for the button's existence
 */
function waitForSendButton() {
  const sendButton = document.querySelector('#sendButton');
  if (sendButton) {
    console.log("Send button found, initializing extension");
    initExtension();
  } else {
    console.log("Send button not found, retrying...");
    setTimeout(waitForSendButton, 100); // Retry after 100ms
  }
}

// Start the initialization process
waitForSendButton();
