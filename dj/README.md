Multichannel segmented audio player demo

There is only very few albums uploaded, due to copyright laws. Sorry for not providing further, or not providing a library functionality, copyright laws for music are very strict.

Here is how uploading process works:
1. Split track with [Audio Seperator](https://github.com/nomadkaraoke/python-audio-separator)
```python
from audio_separator.separator import Separator
separator = Separator(output_format="mp3")
separator.load_model("mel_band_roformer_karaoke_aufr33_viperx_sdr_10.1956.ckpt")
separator.separate("2023 - Rat Wars/09. ASHAMED.mp3")
```
Out of all models, `mel_band_roformer_karaoke_aufr33_viperx_sdr_10.1956` was cleanest and fastest.
1. Run utilities.
   1. Waveform Peaks [BBC - audiowaveform](https://github.com/bbc/audiowaveform) for vocal and instrumental `audiowaveform -i 09.ASHAMED_vocal.mp3 --pixels-per-second 100 --output-format json > 09.ASHAMED_vocal.json`
   2. Duration [FFMPEG](https://ffmpeg.org/). `ffprobe -i 09.ASHAMED_vocal.mp3 -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 -v error`
   3. Tempo [sonic-annotator](https://www.vamp-plugins.org/download.html). `sonic-annotator -d vamp:qm-vamp-plugins:qm-tempotracker:tempo-w csv 09.ASHAMED_vocal.mp3`
   4. Key [keyfinder-cli](https://github.com/evanpurkhiser/keyfinder-cli)`keyfinder-cli 09.ASHAMED_vocal.mp3`
   5. Metatadata [exif-tool](https://exiftool.org/)`exiftool 09.ASHAMED_vocal.mp3`
2. Segment both vocal and instrumental audio with [FFMPEG](https://ffmpeg.org/).
```bash
ffmpeg -i file_path -c:a aac -b:a 320k -f segment -segment_time 40 -segment_list ashamed_playlist.m3u8 -segment_format mpegts ashamed_segment_%03d.ts
```
3. Upload segments and playlists to S3, path must be `bucket-name/album-name/song-name/...` like this `cansu-dev-dj/Burnt Sugar/01. Only Friend/vocal/` or instrumental.
4. Upload metadata and every other utility outputs to backend server in the format of
```json
{
  "metadata": audio_data["metadata"],
  "key": audio_data["key"],
  "tempo": audio_data["tempo"],
  "length": audio_data["length"],
  "instrumentalFolderPath": 
  "instrumental": self.is_instrumental,
  "vocalFolderPath": 
  "waveform": audio_data["waveform"],
  "vocalWaveform": audio_data["vocalWaveform"],
}
```
leave `vocalFolderPath` if the track has no vocals. `instrumentalFolderPath` is required. both is folder locations in bucket like `cansu-dev-dj/Burnt Sugar/01. Only Friend/vocal/` or instrumental.


I will make a GUI for this process soon.