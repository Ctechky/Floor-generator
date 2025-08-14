# 🏠 Floor Plan Generator → AutoCAD DXF Export

[![3D Floor Plan Preview](3D%20Floorpan.png)](3D%20Floorpan.png)  
*(Click for full-size: Example 3D layout in the app)*

[![AutoCAD DXF Export Preview](AutoCADdxf.png)](AutoCADdxf.png)  
*(Click for full-size: AutoCAD DXF export example)*

---

## ✨ What This Tool Does

This tool helps you **visualize and generate the top 10 possible room layouts** for your floor area — fast, smart, and interactive!  

- **Ranking & Sorting Rules:**  
  1. ✅ **Feasibility:** Layout must include **at least 1 of each requested room type**.  
  2. 🏢 **Most Rooms:** Prioritize layouts with the **highest number of rooms**.  
  3. 🎨 **Variety (tiebreaker):** Favor layouts with **more room type variety**.  
  4. 📏 **Space Use (tiebreaker):** Prefer layouts with **greater total covered area**.  
- **Output:** Up to **10 layouts**, ranked by the rules above.  

---

## 🚀 Quick Start

1. **Set Floor Area**  
   - Define `width` and `height` (meters / cm / mm).  

2. **Add Blocked Areas**  
   - Columns, stairs, corridors, shafts, etc.  
   - Use presets or custom sizes.  

3. **Define Room Types**  
   - Name, dimensions, color, and **quantity** (exact or “as many as possible”).  

4. **Generate Layouts**  
   - Click **Generate Layouts** → algorithm runs and ranks candidates.  

5. **Review Top 10**  
   - Use **Previous / Next** to browse the best layouts.  

6. **View Modes**  
   - **2D:** Blueprint view with measurements & adjacency.  
   - **3D:** Interactive walkthrough — pan, zoom, rotate!  

7. **Export**  
   - **JSON:** Full session (inputs + chosen layout).  
   - **DXF:** CAD-ready 2D plan for AutoCAD, SketchUp, LibreCAD, etc.  

---

## 🏡 Room Types & Layout Configuration

- **Name:** e.g., `Master Bedroom`, `Kitchen`, `Office`  
- **Dimensions:** `width` × `height`  
- **Quantity:**  
  - Number → exact count to fit  
  - Blank → generator tries to fit **as many as possible**  
- **Color:** visual identifier in 2D/3D  

> The exported JSON contains all layout details, but you don’t need to touch it to use the DXF.

---

## 📥 Import DXF into AutoCAD

- Open AutoCAD.  
- Go to **File → Open**, select your `.dxf` file.  
- Verify the floor plan appears.  
- Optional: annotate, add dimensions, or tweak layer colors.  

> Works seamlessly with AutoCAD, LibreCAD, SketchUp, and other CAD software.

---

## 🌐 Deploy on Your Own Domain

| Step | What to Do |
|------|------------|
| 1 | **Choose Hosting** <br>• Free: GitHub Pages, Netlify, Vercel <br>• Paid: DigitalOcean, AWS, Google Cloud |
| 2 | **Upload Project** <br>Make sure `index.html` is in the root/public folder |
| 3 | **Point Domain** <br>Update DNS: A record (server IP) or CNAME (hosted platform) |
| 4 | **Test** <br>Open your domain in a browser and see the app live |
| 5 | **Enable HTTPS (Optional)** <br>Use Let’s Encrypt for free SSL |

---

## 💡 Notes

- DXF files are **CAD-ready**; no manual conversion needed.  
- 2D/3D previews let you **double-check layouts** before exporting.  
- Fully **static deployment**, no backend required.  
- Perfect for **architects, interior designers, or space planners** who want **fast, visual floor planning**.  

---

Feel free to **explore, tweak, and deploy** — your floor plans are only a few clicks away! 🏢✨
