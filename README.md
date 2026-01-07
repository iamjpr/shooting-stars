# ✨ Shooting Stars

A mesmerizing, Grok inspired starfield animation featuring **2850+ real astronomical stars** with twinkling effects and shooting stars.

![Starfield Preview](starfield.gif)

## 🌟 Features

- **Real Star Positions** - 2,851 stars from the Yale Bright Star Catalog with accurate RA/Dec coordinates
- **True Star Colors** - Colors based on B-V color index (blue giants to red supergiants)
- **Magnitude-Based Sizing** - Brighter stars appear larger (Sirius, Vega, Arcturus)
- **Multi-Color Twinkling** - Stars shimmer with subtle rainbow color shifts
- **Shooting Stars** - Random meteors from any direction with glowing tails
- **Sky Rotation** - Simulates Earth's rotation (~9 minutes per full rotation)
- **GIF Export** - Built-in recorder to capture and share animations

## 🚀 Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/iamjpr/shooting-stars.git
   cd shooting-stars
   ```

2. Start a local server:
   ```bash
   python3 -m http.server 8000
   ```

3. Open in browser:
   ```
   http://localhost:8000
   ```

## ⌨️ Controls

| Key | Action |
|-----|--------|
| `G` | Record a 6-second GIF |

## 📁 Project Structure

```
shooting-stars/
├── index.html        # Main HTML file
├── style.css         # Canvas styling
├── script.js         # Animation engine
├── stars-data.js     # Real star catalog (2,851 stars)
├── gif-recorder.js   # GIF export functionality
└── README.md
```

## ⚙️ Configuration

Edit `CONFIG` in `script.js` to customize:

```javascript
const CONFIG = {
    // Star rendering
    useRealStars: true,
    additionalRandomStars: 50,
    starMinSize: 0.5,
    starMaxSize: 3.0,
    
    // Twinkle effect
    flickerBaseOpacity: 0.4,
    flickerMaxOpacity: 0.6,
    flickerSpeed: 0.0015,
    
    // Sky rotation
    rotationSpeed: 0.0002,  // ~9 min full rotation
    
    // Shooting stars
    shootingStarChance: 0.008,
    shootingStarMinSpeed: 2,
    shootingStarMaxSpeed: 2,
    shootingStarMaxActive: 2,
    
    // Background
    backgroundColor: '#000000',
};
```

## 🌌 Star Data

The star catalog includes famous stars like:

| Star | Constellation | Magnitude | Color |
|------|---------------|-----------|-------|
| Sirius | Canis Major | -1.46 | White |
| Canopus | Carina | -0.72 | White-Yellow |
| Arcturus | Boötes | -0.05 | Orange |
| Vega | Lyra | 0.03 | White |
| Rigel | Orion | 0.18 | Blue-White |
| Betelgeuse | Orion | 0.45 | Red |
| Polaris | Ursa Minor | 1.97 | Yellow |

Data source: [Yale Bright Star Catalog](http://tdc-www.harvard.edu/catalogs/bsc5.html) via [D3-Celestial](https://github.com/ofrohn/d3-celestial)

## 📸 Creating a GIF

1. Open the starfield in your browser
2. Press `G` to start recording
3. Wait 6 seconds for capture
4. GIF downloads automatically as `starfield.gif`

**Output specs:** 480×270, ~12.5 fps, optimized for Twitter/X

## 🛠️ Technologies

- Vanilla JavaScript (no frameworks)
- HTML5 Canvas API
- [gif.js](https://github.com/jnordberg/gif.js) for GIF export

## 📄 License

MIT License - feel free to use, modify, and share!

## 🙏 Credits

- Star data: Yale Bright Star Catalog / Hipparcos
- Inspired by: Grok's space background
- Built with: ☕ and curiosity

---

*Made with ✨ for stargazers everywhere*
