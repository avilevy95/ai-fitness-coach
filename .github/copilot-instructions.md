# Repository engineering rules

- Use strict TypeScript and keep shared interfaces in `src/types/`.
- Use natural Israeli Hebrew for all user-facing copy and support RTL throughout.
- Use logical layout properties (`marginStart`, `marginEnd`, `paddingStart`, `paddingEnd`) instead of LTR-specific left/right properties.
- Force RTL in app startup with `I18nManager.forceRTL(true)`.
- Pose estimation and Skia drawing must execute inside `useSkiaFrameProcessor` worklets. Never send raw frames across the JavaScript bridge.
- Sub-agent edits must remain within their assigned directories.
- Preserve on-device privacy: camera frames never leave the device.
