const usernameHash = import.meta.env.VITE_AUTH_USERNAME_SHA256;
const passwordHash = import.meta.env.VITE_AUTH_PASSWORD_SHA256;
const realm = import.meta.env.VITE_AUTH_REALM || "London Jitsu 40";
const sessionKey = "grading-panic-authenticated";

function isAuthConfigured(): boolean {
  return Boolean(usernameHash && passwordHash);
}

async function sha256(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function showAccessDenied(): void {
  document.body.innerHTML = "";
  const wrapper = document.createElement("main");
  wrapper.style.minHeight = "100vh";
  wrapper.style.display = "grid";
  wrapper.style.placeItems = "center";
  wrapper.style.background = "#050913";
  wrapper.style.color = "#f5f2eb";
  wrapper.style.fontFamily = '"Courier New", "Monaco", monospace';
  wrapper.style.textAlign = "center";
  wrapper.style.padding = "24px";
  wrapper.innerHTML = "<strong>ACCESS DENIED</strong>";
  document.body.appendChild(wrapper);
}

export async function requirePrototypeAuth(): Promise<boolean> {
  if (!isAuthConfigured() || sessionStorage.getItem(sessionKey) === "true") {
    return true;
  }

  const username = window.prompt(`${realm}\n\nUsername`);
  const password = username === null ? null : window.prompt(`${realm}\n\nPassword`);

  if (username === null || password === null) {
    showAccessDenied();
    return false;
  }

  const [enteredUsernameHash, enteredPasswordHash] = await Promise.all([
    sha256(username),
    sha256(password),
  ]);

  const authenticated = enteredUsernameHash === usernameHash && enteredPasswordHash === passwordHash;
  if (authenticated) {
    sessionStorage.setItem(sessionKey, "true");
    return true;
  }

  showAccessDenied();
  return false;
}
