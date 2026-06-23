---
root_node: root-0001
created: 2026-06-23
---

# Image Dominant Colour Finder

A single-page Astro web app that accepts an image upload, analyses its pixel data to find the most frequent colours, and displays them as a scrollable bar chart ranked from most to least dominant. A quantization slider lets the user adjust colour bucket granularity in real time — re-aggregation happens client-side from a cached pixel map, so no server round-trip is needed after the initial upload.
