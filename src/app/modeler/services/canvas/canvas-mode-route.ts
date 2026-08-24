export function isCanvasModeRoute(currentUrl: string, modeUrl: string): boolean {
    const suffixIndex = currentUrl.search(/[?#]/);
    const path = suffixIndex === -1 ? currentUrl : currentUrl.slice(0, suffixIndex);
    return path === modeUrl;
}
