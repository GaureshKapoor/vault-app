import { useDeepLinks } from "@/hooks/useDeepLinks";
import { useStatusBar } from "@/hooks/useStatusBar";

/**
 * Component that handles native app functionality:
 * - Deep links for OAuth callbacks
 * - Status bar style management
 * Must be rendered inside BrowserRouter for useNavigate to work.
 */
export function DeepLinkHandler() {
  useDeepLinks();
  useStatusBar();
  return null;
}
