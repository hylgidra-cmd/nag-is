import { Global, Module } from '@nestjs/common';
import { VideoService } from './video.service';

@Global()
@Module({
  providers: [VideoService],
  exports: [VideoService],
})
export class VideoModule {}
