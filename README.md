# StreamFlow - M3U/M3U8 Player

A beautiful, modern web-based player for M3U and M3U8 streaming playlists with a sleek glassmorphism design.

![StreamFlow](https://img.shields.io/badge/License-MIT-blue)
![JavaScript](https://img.shields.io/badge/Made%20with-JavaScript-yellow)
![Responsive](https://img.shields.io/badge/Responsive-Yes-green)

## ✨ Features

### 🎵 Fixed Channel Support
- Preloaded with 3 fixed M3U8 live channels
- No manual file upload or URL entry required
- Fast channel switching from playlist panel

### 🎬 Playback Control
- ⏯️ Play/Pause functionality
- ⏭️ Next/Previous track navigation
- 🔄 Shuffle mode
- 🔁 Repeat modes (off, repeat all, repeat one)
- 🔊 Volume control with slider
- ⏱️ Progress bar with seek functionality
- 📊 Current time and duration display

### 🎨 Beautiful Design
- Modern dark theme with gradient backgrounds
- Glassmorphism effects (blur + transparency)
- Smooth animations and transitions
- Professional color scheme (Indigo, Pink, Amber)
- Fully responsive layout (desktop, tablet, mobile)
- Now Playing section with track information

### ⚙️ Advanced Features
- 🌙 Dark/Light theme toggle
- 💾 Local storage for settings
- 🎚️ HLS quality selector (auto and available stream levels)
- ⌨️ Keyboard shortcuts
  - `Space` - Play/Pause
  - `Arrow Right` - Next track
  - `Arrow Left` - Previous track
- 🔍 Search/Filter tracks in playlist
- 🎥 Video and audio playback support
- ⚡ Auto-play next track option
- 📱 Mobile-friendly interface

## 🚀 Getting Started

### Usage

1. **Open in Browser**: Simply open `index.html` in any modern web browser
2. **Choose Channel**: Select one of the 3 preloaded channels
3. **Play**: Click the play button or change channels from the playlist
4. **Control**: Use the player controls or keyboard shortcuts

### File Structure

```
m3u-player/
├── index.html      # Main HTML structure
├── styles.css      # Styling and animations
├── player.js       # Player functionality
└── README.md       # Documentation
```

## 🛠️ Technologies Used

- **HTML5** - Semantic structure
- **CSS3** - Modern styling with gradients and animations
- **JavaScript** - Pure vanilla JS (no dependencies)
- **Font Awesome** - Icons (via CDN)
- **HTML5 Audio/Video API** - Media playback

## 📋 Browser Support

- Chrome/Edge (Latest)
- Firefox (Latest)
- Safari (Latest)
- Opera (Latest)
- Mobile browsers (Chrome, Safari, Firefox)

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `→` | Next Track |
| `←` | Previous Track |

## 🎯 M3U/M3U8 Format

The player supports standard M3U/M3U8 playlist format:

```
#EXTM3U
#EXTINF:123,Artist - Song Title
http://stream.example.com/song.mp3
#EXTINF:456,Another Song
http://stream.example.com/song2.mp3
```

## 🔧 Settings

- **Auto-play Next Track**: Automatically play the next track when current one ends
- **Theme**: Switch between Dark and Light themes
- Settings are saved in local storage

## 📱 Responsive Design

The player is fully responsive and works perfectly on:
- 📺 Desktop (1920px and above)
- 💻 Laptop (1024px - 1920px)
- 📱 Tablet (768px - 1024px)
- 📲 Mobile (320px - 768px)

## 🎨 Color Scheme

- **Primary**: Indigo (#6366f1)
- **Secondary**: Pink (#ec4899)
- **Accent**: Amber (#f59e0b)
- **Background**: Dark Navy (#0f172a)

## 📝 License

MIT License - Feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Feel free to fork, modify, and improve this project!

## 🙏 Acknowledgments

- Font Awesome for beautiful icons
- Inspired by modern streaming services

## 📞 Support

If you encounter any issues or have suggestions, please open an issue or contact the maintainer.

---

**Enjoy streaming!** 🎵🎬
