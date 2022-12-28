# The Economist "World Ahead" Audio Downloader

A Node.js script to download audio for The World Ahead magazine from The Economist using Playwright. You _must_ have a paid subscription to The Economist to use this script.

## Environment Variables

- `ECONOMIST_USERNAME` - Your account username
- `ECONOMIST_PASSWORD` - Your account password
- `ECONOMIST_AUTH_URL` - The URL to authenticate with. For example, <https://www.economist.com/api/auth/login>.
- `OUTPUT_DIR` - The directory to save the audio files to
- `SOURCE_PAGE` - The page to start downloading from. For example, for The World Ahead 2023, use <https://www.economist.com/the-world-ahead/2022/11/18/the-world-ahead-2023>.
