/** Capacidades de autenticação do aparelho (tablet sem sensor vs celular). */

export async function hasPlatformBiometrics(): Promise<boolean> {
  try {
    if (!window.PublicKeyCredential) return false;
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export async function hasFrontCamera(): Promise<boolean> {
  try {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return Boolean(navigator.mediaDevices?.getUserMedia);
    }
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videos = devices.filter((d) => d.kind === "videoinput");
    if (videos.length === 0) return false;
    return true;
  } catch {
    return Boolean(navigator.mediaDevices?.getUserMedia);
  }
}
