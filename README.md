<div align="center">
<img width="1200" height="475" alt="MainBanner" src="https://raw.githubusercontent.com/banyapon/thailand-horror-jam-into-the-woods/refs/heads/main/screenshots/7.png" />
</div>

# Thailand Horror Jam 2025 — *“Into the Woods”*
**WebGL & PC Game**

> *Developed for the Thailand Horror Jam 2025, organized by BitEgg and TGA (Thai Game Software Industry Association).*

---

## Project Overview

**Into the Woods** is a horror investigation game created during the **Thailand Horror Jam 2025** (Oct 25–31, 2025), under the theme **“Sign.”**  
The project was developed solo within one week using **TypeScript**, **Three.js**, and **Electron** — aiming to deliver a native WebGL experience with a responsive layout for both desktop and mobile browsers.

<img width="1200" height="475" alt="MainBanner" src="https://raw.githubusercontent.com/banyapon/thailand-horror-jam-into-the-woods/refs/heads/main/screenshots/5.png" />

Although the mobile interface supports a **Virtual Joystick**, the full gameplay experience is best enjoyed on **PC Browser** or **Electron Desktop App**.

---

## Game Modes
<div align="center">
<img width="1200" height="475" alt="MainBanner" src="https://raw.githubusercontent.com/banyapon/thailand-horror-jam-into-the-woods/refs/heads/main/screenshots/1.png" />

<img width="1200" height="475" alt="MainBanner" src="https://raw.githubusercontent.com/banyapon/thailand-horror-jam-into-the-woods/refs/heads/main/screenshots/2.png" />
</div>
### 1. Story Mode
<div align="center">
<img width="1200" height="475" alt="MainBanner" src="https://raw.githubusercontent.com/banyapon/thailand-horror-jam-into-the-woods/refs/heads/main/screenshots/3.png" />

<img width="1200" height="475" alt="MainBanner" src="https://raw.githubusercontent.com/banyapon/thailand-horror-jam-into-the-woods/refs/heads/main/screenshots/6.png" />
</div>
Investigate mysterious deaths deep in the woods — collect evidence, interrogate witnesses, and accuse suspects **before the summoned spirit attacks you.**

### 2. Despair Mode
A survival challenge featuring **seven villagers** who must find a way to destroy all **ritual altars** before they are hunted down.  
There’s no main character or storyline — only instinct and survival.

---

## Jam Limitations & Theme Integration

| Rule | Implementation |
|------|----------------|
| **Decoding** | Players must interpret and solve coded clues during interrogations. |
| **I Can’t See** | Dynamic weather and fog effects reduce visibility during critical moments. |

---

## Controls

| Action | Input |
|--------|--------|
| Move | **WASD** / **Arrow Keys** / **Virtual Joystick** |
| Interact / Inspect | **E** / **Click / Touch** |
| Follow Target | **P** |
| Show Hint | **H** |

---

## Technical Stack

- **Language:** TypeScript (TSX Native Web Script)
- **Rendering:** Three.js (WebGL)
- **Desktop Runtime:** Electron + Electron Builder
- **Graphics:** Adobe Photoshop + Generative AI assisted redrawing  
- **Responsive Design:** Partial (Mobile optimization in progress)

---

<div align="center">
<img width="1200" height="475" alt="MainBanner" src="https://raw.githubusercontent.com/banyapon/thailand-horror-jam-into-the-woods/refs/heads/main/screenshots/4.png" />
</div>

## Development Notes

This project was built rapidly within the 7-day jam timeframe.  
All source code was written **natively from scratch**, without pre-built frameworks or structured architecture — expect some chaotic parts in the codebase.  
Graphics were manually designed with **Photoshop**, and some art assets were assisted using **Generative AI redrawing** for refinement and concept referencing.

---

## Developer

**Solo Developer:** [Banyapon Poolsawas](https://github.com/banyapon)  
Bangkok, Thailand  

---

## Acknowledgments

Special thanks to  
**BitEgg** and **TGA (Thai Game Software Industry Association)**  
for organizing **Thailand Horror Jam 2025**, and to all creators who shared their hauntingly inspiring work.

---

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## Run Build and Pack to Windows, Linux and Mac App

1. Install dependencies:
   `npm install electron --save-dev`
   `npm install electron-builder --save-dev`
2. Run and Test:
   `npm run build`
   `npm start`
3. Run an Electron Builder:
   `npm run dist`
