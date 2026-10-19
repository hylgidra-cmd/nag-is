import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';

/** What a client needs to play a lesson, with no storage path exposed. */
export interface PlaybackDescriptor {
  provider: string;
  /** Short-lived playback URL, when the provider issues one. */
  url: string | null;
  /** Provider playback id, for SDK-based players. */
  playbackId: string | null;
  /** When the descriptor stops working, so the client can re-request. */
  expiresAt: string | null;
}

/**
 * Video hosting, behind a driver boundary.
 *
 * The stored `videoRef` is never handed to a client. This service turns it
 * into a short-lived playback descriptor, and only ever for a caller the
 * lessons service has already authorised. That ordering is deliberate: the
 * access check happens first, and this runs only afterwards.
 *
 * With `VIDEO_DRIVER=none` (the development default) there is no provider, so
 * `resolve` returns null and the player shows a clearly labelled placeholder.
 * It does not invent a URL or pretend playback works.
 */
@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);

  constructor(private readonly config: AppConfigService) {}

  get isConfigured(): boolean {
    return this.config.video.driver !== 'none';
  }

  /**
   * Resolves a lesson's stored reference into playable form.
   *
   * Returns null when no provider is configured or the lesson has no video,
   * which the API surfaces as `video: null` so the UI can say so honestly.
   */
  resolve(videoRef: string | null): Promise<PlaybackDescriptor | null> {
    // Not `async`: no driver performs I/O yet. The Promise return type is
    // kept because every real provider will need to sign a playback token
    // over the network, and that must not be a signature change.
    if (!videoRef) return Promise.resolve(null);

    const { driver } = this.config.video;

    switch (driver) {
      case 'none':
        // No provider. A stored ref cannot be turned into playback, and
        // echoing it back would leak whatever it points at.
        this.logger.debug('VIDEO_DRIVER=none; lesson video not resolved');
        return Promise.resolve(null);

      case 'mux':
      case 'vimeo':
      case 'bunny':
        // The integration boundary. Each provider needs its own signed
        // playback token; none is implemented yet, so this fails loudly
        // rather than returning something that looks valid.
        return Promise.reject(
          new Error(
            `VIDEO_DRIVER="${driver}" is configured but its playback signing is not ` +
              'implemented yet. Implement VideoService.resolve for this provider, or ' +
              'set VIDEO_DRIVER="none". See docs/development.md.',
          ),
        );

      default: {
        // Exhaustiveness guard: a new driver added to the env schema must be
        // handled above, and TypeScript will point at this line if it is not.
        const exhaustive: never = driver;
        throw new Error(`Unhandled video driver: ${String(exhaustive)}`);
      }
    }
  }

  /** Human-readable driver name, for the health endpoint. */
  get driverName(): string {
    return this.config.video.driver;
  }
}
