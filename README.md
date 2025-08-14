# Floor Plan Generator

![A screenshot of the Floor Plan Generator UI showing a generated 2D layout with a control panel on the left.](placeholder.png)
*(Image: A generated floor plan within the application UI)*

Welcome! This tool is designed to take the headache out of floor plan design. Think of it as your personal assistant for arranging rooms. You tell it the size of your space and the rooms you need, and our powerful algorithm gets to work, finding the most efficient and logical ways to fit everything together. It's like a super-fast game of Tetris, but for your future home or office!

---

## 🚀 Getting Started: Your First Floor Plan

Ready to create something? Just follow these simple steps.

#### 1. Set Your Canvas
In the **Floor Area Settings**, define the overall `width` and `height` of your space. This is the blank canvas for your design, like the outer walls of an apartment or a single floor of a building. You can work in meters, centimeters, or millimeters.

#### 2. Add the Unmovable Stuff
Every building has things you can't move, like support columns, staircases, or a central corridor. In the **Blocked Areas** section, you can add these constraints. Use one of the handy presets (like "Column" or "Staircase") or define a custom-sized area. The generator will treat these areas as solid and will not place any rooms on top of them.

#### 3. Define Your Rooms
Now for the fun part! In the **Room Types** section, add all the rooms you need. For each room, you can specify:
-   **Name**: "Master Bedroom", "Kitchen", "Office", etc.
-   **Dimensions**: The `width` and `height` of the room.
-   **Quantity**: How many of this room type you want. If you leave this blank, the generator will try to fit as many as it can!
-   **Color**: Pick a color to help you visually identify the room on the plan.

#### 4. Let the Magic Happen!
Once you've defined your space and rooms, click the big **Generate Layouts** button. Our algorithm will instantly run hundreds of trials, testing different positions and rotations for each room to find the best possible arrangements.

#### 5. Review Your Options
The generator will present you with up to 10 of the most optimal layouts it found. Use the **Previous** and **Next** buttons to cycle through them. The layout on the screen will update instantly, showing you the different possibilities.

#### 6. See it in 2D and 3D
You can inspect each layout in two ways:
-   **2D View**: A classic, top-down blueprint that's perfect for understanding measurements and adjacencies.
-   **3D View**: Take a virtual walk through your new space! This view helps you get a real feel for the scale and flow of the layout. You can pan, zoom, and rotate to see it from every angle.

#### 7. Save Your Work
Found a plan you love? You have two great options to save it:
-   **Export JSON**: This saves your *entire session*—the floor dimensions, all your room definitions, the blocked areas, and the final layout. It's perfect for archiving or coming back to your design later.
-   **Export DXF**: This saves the 2D plan as a DXF file, a universal format that can be opened in professional CAD software like AutoCAD, SketchUp, or LibreCAD for further refinement.

## ✨ What Makes This Tool Special?

-   **Smart, Not Random**: Our algorithm doesn't just throw rooms on a canvas. It intelligently sorts and filters the hundreds of layouts it tries, ranking them based on what matters most:
    1.  **Completeness**: First, it prioritizes layouts that successfully include at least one of every single room type you asked for.
    2.  **Room Count**: Next, it prefers layouts that fit more of your requested rooms into the space.
    3.  **Variety**: Then, it favors layouts that use a wider variety of your defined room types.
    4.  **Space Used**: Finally, as a tie-breaker, it chooses the layout that covers the most total area.
-   **Your Space, Your Rules**: Total freedom to define your floor plan, rooms, and constraints. Work in the units you're comfortable with.
-   **Instant Visualization**: Switch between a clean 2D blueprint and an immersive 3D walkthrough in a single click. See your ideas come to life immediately.
-   **Professional Export**: Take your designs to the next level by exporting to DXF for use in industry-standard CAD software.
-   **Works in Any Light**: Toggle between a bright **Light Mode** and a sleek **Dark Mode** for comfortable viewing, day or night.

## 🛡️ Your Designs are Yours Alone

We believe in privacy. All the processing, from layout generation to 3D rendering, happens **100% in your browser**. Your data is never sent to a server. When you close the browser tab, your work is gone from our end. This ensures your designs remain completely private and under your control.

## 💻 Technology

For those who are curious, here’s what powers the application:

-   **Frontend**: React, TypeScript
-   **2D Graphics**: Plotly.js
-   **3D Graphics**: Three.js
-   **Styling**: Tailwind CSS with CSS Variables for theming
-   **Build**: No build step! It uses modern browser features like ES modules and import maps for a fast, simple setup.

## License

This project is licensed under the MIT License.
