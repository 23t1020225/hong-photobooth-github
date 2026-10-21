# Camera filter references

The camera filters are original Canvas 2D drawings. They are inspired by the
following effect categories, not imported TikTok effects or Snapchat Lenses.
No third-party effect images, code, logos, or proprietary runtime are bundled.

- TikTok Effect House, Critter Stickers: 2D animal stickers and makeup.
  https://effecthouse.tiktok.com/learn/guides/tutorials/template-tutorials/critter-stickers
- TikTok Effect House, Face Mask: face paint and makeup effects.
  https://effecthouse.tiktok.com/learn/guides/workspace/components/face-effects/face-mask
- Snapchat Support, Lenses: puppy and flower crown examples.
  https://help.snapchat.com/hc/en-us/articles/7012348332052-How-do-I-use-Lenses-on-Snapchat
- Snapchat Lens gallery, Butterfly Effect: butterfly face decoration reference.
  https://www.snapchat.com/lens/6f197317b6ae422fa03cfdcec7ddad97

New original styles: puppy, bear, cheek hearts, freckles, purple butterflies,
flower crown, sunglasses, and sparkles. Bear, hearts, sunglasses and sparkles
are general camera decoration designs, not reproductions of specific effects.

All styles support on-device tracking of one face with MediaPipe Face Landmarker,
including camera cropping, mirrored preview, roll and size. There is no face
reshaping. Users may disable tracking to use the manual position controls.
The same camera canvas is captured and used for strip preview and PNG export.
No camera images or face landmarks are sent to an external service.

Tracking implementation reference:
https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker/web_js

Bundled runtime: @mediapipe/tasks-vision 0.10.32, Apache-2.0.
The original CJS bundle is served as vision_bundle.js for browser MIME support.
The original package metadata and license are in assets/vendor/mediapipe/.
WASM binaries (SIMD and non-SIMD) are served locally from the same directory.
Model: Google's Face Landmarker float16 version 1, stored locally at
assets/models/face_landmarker.task. Download source:
https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task

## Approved reference set (14 new original drawings)

| Preview number | Website effect | Reference |
| --- | --- | --- |
| 1 | bunny-hat | TikTok Critter Stickers (link above) |
| 2 | expressive-ears | https://effecthouse.tiktok.com/learn/guides/tutorials/template-tutorials/expressive-ears |
| 3 | flower-veil | https://effecthouse.tiktok.com/learn/guides/tutorials/template-tutorials/face-veils |
| 4 | soft-freckles | https://effecthouse.tiktok.com/learn/guides/tutorials/template-tutorials/freckles-makeup |
| 5 | bunny-cheeks | https://www.crehana.com/blog/brasil/filtros-de-instagram-guia/ |
| 6 | pink-butterflies | https://www.lanacion.com.ar/tecnologia/nahir-esper-y-tomas-posse-los-artistas-argentinos-que-crearon-filtros-para-instagram-que-usan-nid10062022/ |
| 7 | panda | https://wowfilters.com/192/panda-bear-face-mask/ |
| 8 | frog-hat | https://www.lemon8-app.com/@racunbyekhu/7227058045010854402?region=id |
| 9 | strawberry | https://www.phucanh.vn/tong-hop-1001-filter-instagram-chup-anh-sieu-de-thuong.html |
| 10 | gummy-bears | https://chillpainai.com/scoop/12799 |
| 11 | hair-clips | Phuc Anh article linked above |
| 12 | star-blush | Phuc Anh article linked above |
| 13 | clouds | https://www.elitedaily.com/p/12-cute-instagram-story-filters-for-capturing-all-the-sweet-moments-22758603 |
| 14 | avocado | https://seventeen-web.jp/lifestyle/l-news/131/ |

Reference pictures are not bundled or fetched by the website. The new artwork
uses the existing on-device tracking, capture and PNG export pipeline. Expressive
ears respond to the averaged mouthSmileLeft/mouthSmileRight blendshape scores;
the flower veil is a 2D illustration, not a cloth simulation or imported 3D effect.
